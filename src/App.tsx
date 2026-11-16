import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  Activity,
  Building2,
  CalendarClock,
  CheckCircle2,
  Database,
  Landmark,
  Lock,
  LogIn,
  LogOut,
  Map,
  Percent,
  RefreshCw,
  Sparkles,
  Vote,
} from 'lucide-react';
import {
  BETTING_DEADLINE_DATE,
  CONGRESS_PARTIES,
  isBettingOpen,
  PROVINCE_MAP,
  SENATE_PARTIES,
} from './constants/elections';
import {
  isSupabaseConfigured,
  signInWithGoogle,
  signOutUser,
  supabase,
  syncUserProfile,
} from './lib/supabase';
import { LIVE_RESULTS_URL, useLiveResults } from './hooks/useLiveResults';
import {
  NationalPctPredictionRow,
  NationalSeatPredictionRow,
  ProvincialPredictionRow,
  SenatePredictionRow,
  UserProfile,
} from './utils/rankings';
import { ProvincialSection } from './components/ProvincialSection';
import { NationalSeatsSection } from './components/NationalSeatsSection';
import { NationalPctSection } from './components/NationalPctSection';
import { SenateSection } from './components/SenateSection';
import { SectionType, UserVoteModal } from './components/UserVoteModal';

function formatCountdown(now: Date): string {
  const diff = BETTING_DEADLINE_DATE.getTime() - now.getTime();
  if (diff <= 0) return 'Cerrada (29 Nov 2026 · 09:00h)';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

export const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<SectionType>('provincial');
  const [now, setNow] = useState<Date>(() => new Date());

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [provincialRows, setProvincialRows] = useState<ProvincialPredictionRow[]>([]);
  const [nationalSeatRows, setNationalSeatRows] = useState<NationalSeatPredictionRow[]>([]);
  const [nationalPctRows, setNationalPctRows] = useState<NationalPctPredictionRow[]>([]);
  const [senateRows, setSenateRows] = useState<SenatePredictionRow[]>([]);
  const [dbFetching, setDbFetching] = useState<boolean>(false);
  const [schemaMissingWarning, setSchemaMissingWarning] = useState<boolean>(false);

  const [modalUserId, setModalUserId] = useState<string | null>(null);

  const {
    results: liveResults,
    isLoading: liveLoading,
    isWaitingForScrutiny,
    isSimulationMode,
    toggleSimulationMode,
    refreshNow: refreshLiveResults,
  } = useLiveResults();

  // Reloj en vivo para controlar el cierre exacto (2026-11-29 09:00:00+01)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const bettingOpen = isBettingOpen(now);
  const isReadOnly = !bettingOpen;

  // Cargar datos desde Supabase
  const fetchAllPredictions = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setDbFetching(true);

    try {
      const [profRes, provRes, natSeatRes, natPctRes, senRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('provincial_predictions').select('*'),
        supabase.from('national_seat_predictions').select('*'),
        supabase.from('national_pct_predictions').select('*'),
        supabase.from('senate_predictions').select('*'),
      ]);

      const anyMissingTable = [profRes, provRes, natSeatRes, natPctRes, senRes].some(
        (r) => r.error && (r.error.code === 'PGRST205' || r.error.code === '42P01')
      );
      setSchemaMissingWarning(anyMissingTable);

      if (profRes.data) setProfiles(profRes.data as UserProfile[]);
      if (provRes.data) setProvincialRows(provRes.data as ProvincialPredictionRow[]);
      if (natSeatRes.data) setNationalSeatRows(natSeatRes.data as NationalSeatPredictionRow[]);
      if (natPctRes.data) setNationalPctRows(natPctRes.data as NationalPctPredictionRow[]);
      if (senRes.data) setSenateRows(senRes.data as SenatePredictionRow[]);
    } finally {
      setDbFetching(false);
    }
  }, []);

  // Gestión de sesión con Supabase Auth (Google OAuth)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      if (data.session?.user) {
        syncUserProfile(data.session.user).then(() => fetchAllPredictions());
      } else {
        fetchAllPredictions();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        syncUserProfile(newSession.user).then(() => fetchAllPredictions());
      } else {
        fetchAllPredictions();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchAllPredictions]);

  const currentUser = session?.user;

  const profilesMap = useMemo(() => {
    const map: Record<string, UserProfile> = {};
    for (const p of profiles) {
      map[p.id] = p;
    }
    if (currentUser && !map[currentUser.id]) {
      const meta = currentUser.user_metadata || {};
      map[currentUser.id] = {
        id: currentUser.id,
        full_name:
          meta.full_name ||
          meta.name ||
          (currentUser.email ? currentUser.email.split('@')[0] : 'Participante'),
        avatar_url: meta.avatar_url || meta.picture || null,
        updated_at: new Date().toISOString(),
      };
    }
    return map;
  }, [profiles, currentUser]);

  // Handlers de guardado (UPSERT) en las 4 tablas de predicciones
  const handleSaveProvinceSeats = async (
    provinceCode: string,
    seatsByParty: Record<string, number>
  ) => {
    if (!currentUser) throw new Error('Debes iniciar sesión con Google.');
    if (!isBettingOpen()) throw new Error('El plazo de votaciones ya ha cerrado.');

    const prov = PROVINCE_MAP[provinceCode];
    if (!prov) throw new Error('Provincia no válida.');

    const timestamp = new Date().toISOString();
    const payload = prov.parties.map((partyCode) => ({
      user_id: currentUser.id,
      province_code: provinceCode,
      party_code: partyCode,
      seats: Math.max(0, Math.round(seatsByParty[partyCode] ?? 0)),
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from('provincial_predictions')
      .upsert(payload, { onConflict: 'user_id,province_code,party_code' });

    if (error) {
      throw new Error(error.message);
    }

    await fetchAllPredictions();
  };

  const handleSaveNationalSeats = async (seatsByParty: Record<string, number>) => {
    if (!currentUser) throw new Error('Debes iniciar sesión con Google.');
    if (!isBettingOpen()) throw new Error('El plazo de votaciones ya ha cerrado.');

    const timestamp = new Date().toISOString();
    const payload = CONGRESS_PARTIES.map((party) => ({
      user_id: currentUser.id,
      party_code: party.code,
      seats: Math.max(0, Math.round(seatsByParty[party.code] ?? 0)),
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from('national_seat_predictions')
      .upsert(payload, { onConflict: 'user_id,party_code' });

    if (error) {
      throw new Error(error.message);
    }

    await fetchAllPredictions();
  };

  const handleSaveNationalPct = async (pctByParty: Record<string, number>) => {
    if (!currentUser) throw new Error('Debes iniciar sesión con Google.');
    if (!isBettingOpen()) throw new Error('El plazo de votaciones ya ha cerrado.');

    const timestamp = new Date().toISOString();
    const payload = CONGRESS_PARTIES.map((party) => ({
      user_id: currentUser.id,
      party_code: party.code,
      percentage: Number((pctByParty[party.code] ?? 0).toFixed(2)),
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from('national_pct_predictions')
      .upsert(payload, { onConflict: 'user_id,party_code' });

    if (error) {
      throw new Error(error.message);
    }

    await fetchAllPredictions();
  };

  const handleSaveSenateSeats = async (seatsByParty: Record<string, number>) => {
    if (!currentUser) throw new Error('Debes iniciar sesión con Google.');
    if (!isBettingOpen()) throw new Error('El plazo de votaciones ya ha cerrado.');

    const timestamp = new Date().toISOString();
    const payload = SENATE_PARTIES.map((party) => ({
      user_id: currentUser.id,
      party_code: party.code,
      seats: Math.max(0, Math.round(seatsByParty[party.code] ?? 0)),
      updated_at: timestamp,
    }));

    const { error } = await supabase
      .from('senate_predictions')
      .upsert(payload, { onConflict: 'user_id,party_code' });

    if (error) {
      throw new Error(error.message);
    }

    await fetchAllPredictions();
  };

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      );
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    try {
      await signOutUser();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error al cerrar sesión.');
    }
  };

  const navItems: {
    id: SectionType;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
    badge: string;
  }[] = [
    {
      id: 'provincial',
      label: '1. Porra Provincial',
      shortLabel: 'Provincial',
      icon: <Map className="w-4 h-4" />,
      badge: '52 prov · D’Hondt',
    },
    {
      id: 'national_seats',
      label: '2. Estatal Escaños',
      shortLabel: 'Escaños',
      icon: <Landmark className="w-4 h-4" />,
      badge: '350 escaños',
    },
    {
      id: 'national_pct',
      label: '3. Estatal Porcentaje',
      shortLabel: 'Porcentaje %',
      icon: <Percent className="w-4 h-4" />,
      badge: '16 partidos',
    },
    {
      id: 'senate',
      label: '4. Porra del Senado',
      shortLabel: 'Senado',
      icon: <Building2 className="w-4 h-4" />,
      badge: '7 partidos',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50/60 via-slate-50 to-white text-slate-900">
      {/* Cabecera Superior */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Identidad Visual Bet And Vote */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-sm">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                  Bet <span className="text-blue-600">And</span> Vote
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                  Elecciones 29N
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Porra Electoral · Congreso de los Diputados y Senado
              </p>
            </div>
          </div>

          {/* Estado de cierre + Usuario Google OAuth */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                bettingOpen
                  ? 'bg-blue-50/80 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title="Cierre de porras: Domingo 29 de noviembre de 2026 a las 09:00h (hora peninsular)"
            >
              {bettingOpen ? (
                <CalendarClock className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                {bettingOpen
                  ? `Cierre 29N 09:00h (${formatCountdown(now)})`
                  : 'Porras cerradas · Solo lectura'}
              </span>
            </div>

            {authLoading ? (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-medium text-slate-500">
                Cargando...
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100/90 pl-2 pr-2.5 py-1 rounded-xl border border-slate-200">
                {profilesMap[currentUser.id]?.avatar_url ? (
                  <img
                    src={profilesMap[currentUser.id].avatar_url!}
                    alt={profilesMap[currentUser.id]?.full_name || 'Avatar'}
                    className="w-7 h-7 rounded-full object-cover border border-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {(profilesMap[currentUser.id]?.full_name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate hidden sm:inline">
                  {profilesMap[currentUser.id]?.full_name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar con Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Estado de Escrutinio en Tiempo Real (generales29n.com/datos) */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-bold text-sky-400">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                Resultados en directo:
              </span>
              {isWaitingForScrutiny ? (
                <span className="text-slate-300">
                  En espera de inicio del escrutinio en{' '}
                  <a
                    href={LIVE_RESULTS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-sky-300 hover:text-white"
                  >
                    generales29n.com/datos
                  </a>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {liveResults.sourceLabel} ({liveResults.scrutinyPct.toFixed(1)}% escrutado)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSimulationMode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  isSimulationMode
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title="Permite simular resultados reales para comprobar el cálculo de desviaciones en los ránkings"
              >
                <Sparkles className="w-3 h-3" />
                {isSimulationMode ? 'Simulación activa (Desactivar)' : 'Simular escrutinio'}
              </button>

              <button
                type="button"
                onClick={() => {
                  refreshLiveResults();
                  fetchAllPredictions();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors"
                title="Actualizar resultados y ránkings ahora"
              >
                <RefreshCw
                  className={`w-3 h-3 ${liveLoading || dbFetching ? 'animate-spin' : ''}`}
                />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Navegación de las 4 Secciones */}
        <div className="bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <nav
              className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 py-2"
              aria-label="Secciones de la porra"
            >
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-blue-50/60 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={isActive ? 'text-sky-200' : 'text-blue-600'}>
                        {item.icon}
                      </span>
                      <span className="text-xs sm:text-sm truncate">
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden">{item.shortLabel}</span>
                      </span>
                    </div>
                    <span
                      className={`hidden xl:inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {authError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {authError}
          </div>
        )}

        {schemaMissingWarning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                Aviso de Base de Datos: Falta ejecutar <code>supabase/schema.sql</code>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Las tablas de predicciones aún no están creadas en tu proyecto de Supabase. Copia y
                ejecuta el contenido de <code>supabase/schema.sql</code> en el SQL Editor de
                Supabase para activar el guardado y las políticas RLS.
              </p>
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold">
                ¡Participa en la Porra Electoral 29N con tus amigos!
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                Inicia sesión con tu cuenta de Google para guardar tus pronósticos antes del
                domingo 29 de noviembre a las 09:00h. Puedes probar todas las calculadoras ahora
                mismo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogin}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-extrabold shadow-xs shrink-0 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión con Google
            </button>
          </div>
        )}

        {activeSection === 'provincial' && (
          <ProvincialSection
            userId={currentUser?.id}
            isReadOnly={isReadOnly}
            provincialRows={provincialRows}
            profilesMap={profilesMap}
            liveResults={liveResults}
            onSaveProvinceSeats={handleSaveProvinceSeats}
            onSelectRankingUser={(uid) => setModalUserId(uid)}
          />
        )}

        {activeSection === 'national_seats' && (
          <NationalSeatsSection
            userId={currentUser?.id}
            isReadOnly={isReadOnly}
            nationalSeatRows={nationalSeatRows}
            provincialRows={provincialRows}
            profilesMap={profilesMap}
            liveResults={liveResults}
            onSaveNationalSeats={handleSaveNationalSeats}
            onSelectRankingUser={(uid) => setModalUserId(uid)}
          />
        )}

        {activeSection === 'national_pct' && (
          <NationalPctSection
            userId={currentUser?.id}
            isReadOnly={isReadOnly}
            nationalPctRows={nationalPctRows}
            profilesMap={profilesMap}
            liveResults={liveResults}
            onSaveNationalPct={handleSaveNationalPct}
            onSelectRankingUser={(uid) => setModalUserId(uid)}
          />
        )}

        {activeSection === 'senate' && (
          <SenateSection
            userId={currentUser?.id}
            isReadOnly={isReadOnly}
            senateRows={senateRows}
            profilesMap={profilesMap}
            liveResults={liveResults}
            onSaveSenateSeats={handleSaveSenateSeats}
            onSelectRankingUser={(uid) => setModalUserId(uid)}
          />
        )}
      </main>

      {/* Modal de desglose de votos de cualquier participante */}
      <UserVoteModal
        isOpen={Boolean(modalUserId)}
        onClose={() => setModalUserId(null)}
        section={activeSection}
        userId={modalUserId}
        profile={modalUserId ? profilesMap[modalUserId] : undefined}
        provincialRows={provincialRows}
        nationalSeatRows={nationalSeatRows}
        nationalPctRows={nationalPctRows}
        senateRows={senateRows}
        liveResults={liveResults}
      />

      {/* Pie de página */}
      <footer className="bg-white border-t border-slate-200/80 py-5 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="font-semibold text-slate-700">
            Bet And Vote · Porra Electoral 29N (Congreso y Senado)
          </div>
          <div>
            Cierre de modificaciones: Domingo 29 de noviembre de 2026 a las 09:00h (CET) · Datos en
            vivo:{' '}
            <a
              href={LIVE_RESULTS_URL}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              generales29n.com/datos
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
