import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  MapPin,
  RotateCcw,
  Save,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  CONGRESS_MAJORITY_SEATS,
  CONGRESS_PARTIES,
  CONGRESS_PARTY_MAP,
  DHONDT_MIN_THRESHOLD_PCT,
  PROVINCES,
  PROVINCE_MAP,
  TOTAL_CONGRESS_SEATS,
} from '../constants/elections';
import { calculateDHondt } from '../utils/dhondt';
import {
  calculateProvincialRanking,
  LiveResultsData,
  ProvincialPredictionRow,
  UserProfile,
} from '../utils/rankings';
import { HemicycleChart } from './HemicycleChart';
import { RankingCard } from './RankingCard';

interface ProvincialSectionProps {
  userId?: string;
  isReadOnly: boolean;
  provincialRows: ProvincialPredictionRow[];
  profilesMap: Record<string, UserProfile>;
  liveResults: LiveResultsData;
  onSaveProvinceSeats: (
    provinceCode: string,
    seatsByParty: Record<string, number>
  ) => Promise<void>;
  onSelectRankingUser: (userId: string) => void;
}

const LOCAL_PCT_STORAGE_KEY = 'bet_and_vote_provincial_pcts_v1';

export const ProvincialSection: React.FC<ProvincialSectionProps> = ({
  userId,
  isReadOnly,
  provincialRows,
  profilesMap,
  liveResults,
  onSaveProvinceSeats,
  onSelectRankingUser,
}) => {
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('28'); // Madrid por defecto o 01
  const [provinceSearch, setProvinceSearch] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'pending'>('all');

  // Mapa local de porcentajes por provincia y partido: provinceCode -> partyCode -> pct
  const [pctByProvince, setPctByProvince] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PCT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null
  );

  const selectedProvince = PROVINCE_MAP[selectedProvinceCode] || PROVINCES[0];

  // Filas guardadas en base de datos para el usuario actual
  const userSavedByProvince = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    if (!userId) return map;
    for (const row of provincialRows) {
      if (row.user_id !== userId) continue;
      if (!map[row.province_code]) map[row.province_code] = {};
      map[row.province_code][row.party_code] = Number(row.seats) || 0;
    }
    return map;
  }, [provincialRows, userId]);

  const completedProvinceCodes = useMemo(
    () => new Set(Object.keys(userSavedByProvince)),
    [userSavedByProvince]
  );

  // Si el usuario tiene escaños guardados en Supabase para una provincia pero no tiene % en localStorage,
  // reconstruimos unos porcentajes proporcionales para que D'Hondt reproduzca exactamente sus escaños guardados.
  useEffect(() => {
    if (!userId) return;
    setPctByProvince((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const prov of PROVINCES) {
        const savedSeats = userSavedByProvince[prov.code];
        const existingLocal = next[prov.code];
        const hasAnyLocalPct =
          existingLocal && Object.values(existingLocal).some((v) => v > 0);

        if (savedSeats && !hasAnyLocalPct) {
          const totalSaved = Object.values(savedSeats).reduce((a, b) => a + b, 0);
          if (totalSaved > 0) {
            const reconstructed: Record<string, number> = {};
            for (const partyCode of prov.parties) {
              const s = savedSeats[partyCode] ?? 0;
              reconstructed[partyCode] =
                s > 0 ? Number(((s / totalSaved) * 92).toFixed(1)) : 0;
            }
            next[prov.code] = reconstructed;
            changed = true;
          }
        }
      }

      if (changed) {
        try {
          localStorage.setItem(LOCAL_PCT_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
      }
      return changed ? next : prev;
    });
  }, [userSavedByProvince, userId]);

  // Porcentajes actuales de la provincia activa
  const currentProvincePcts = useMemo(() => {
    const map: Record<string, number> = {};
    const stored = pctByProvince[selectedProvince.code] || {};
    for (const partyCode of selectedProvince.parties) {
      map[partyCode] = Number(stored[partyCode] ?? 0);
    }
    return map;
  }, [pctByProvince, selectedProvince]);

  const sumPct = useMemo(
    () =>
      Number(
        Object.values(currentProvincePcts)
          .reduce((a, b) => a + b, 0)
          .toFixed(2)
      ),
    [currentProvincePcts]
  );

  const isOver100 = sumPct > 100.001;

  // Cálculo dinámico D'Hondt con mínimo del 3%
  const dhondtResult = useMemo(
    () =>
      calculateDHondt(
        selectedProvince.seats,
        currentProvincePcts,
        selectedProvince.parties
      ),
    [selectedProvince, currentProvincePcts]
  );

  // Hemiciclo global acumulado del usuario: suma las provincias guardadas en BD
  // + la vista en vivo de la provincia seleccionada si está editándola
  const globalProvincialSeats = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) totals[p.code] = 0;

    for (const prov of PROVINCES) {
      const savedProv = userSavedByProvince[prov.code];
      if (savedProv) {
        for (const [partyCode, seats] of Object.entries(savedProv)) {
          totals[partyCode] = (totals[partyCode] ?? 0) + seats;
        }
      }
    }
    return totals;
  }, [userSavedByProvince]);

  const handlePctChange = (partyCode: string, rawVal: number) => {
    if (isReadOnly) return;
    const clamped = Math.max(0, Math.min(100, Number(rawVal.toFixed(1))));

    setPctByProvince((prev) => {
      const currentProv = { ...(prev[selectedProvince.code] || {}) };
      // Calcular cuánto suman los DEMÁS partidos de la provincia para ayudar a no pasar de 100%
      const otherSum = selectedProvince.parties
        .filter((p) => p !== partyCode)
        .reduce((acc, p) => acc + (currentProv[p] ?? 0), 0);

      const maxAllowed = Math.max(0, Number((100 - otherSum).toFixed(1)));
      currentProv[partyCode] = Math.min(clamped, maxAllowed);

      const updated = {
        ...prev,
        [selectedProvince.code]: currentProv,
      };
      try {
        localStorage.setItem(LOCAL_PCT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setFeedbackMsg(null);
  };

  const handleResetProvince = () => {
    if (isReadOnly) return;
    setPctByProvince((prev) => {
      const updated = { ...prev, [selectedProvince.code]: {} };
      try {
        localStorage.setItem(LOCAL_PCT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setFeedbackMsg(null);
  };

  const handleSave = async (goToNext = false) => {
    if (!userId || isReadOnly) return;
    if (isOver100) {
      setFeedbackMsg({
        type: 'error',
        text: 'La suma de porcentajes no puede superar el 100%.',
      });
      return;
    }
    if (dhondtResult.totalAllocated === 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Introduce al menos un partido con un 3% o más de voto para repartir los escaños.',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveProvinceSeats(selectedProvince.code, dhondtResult.seatsByParty);
      setFeedbackMsg({
        type: 'ok',
        text: `¡Escaños de ${selectedProvince.name} guardados correctamente!`,
      });
      if (goToNext) {
        const currentIndex = PROVINCES.findIndex((p) => p.code === selectedProvince.code);
        const nextProv = PROVINCES[(currentIndex + 1) % PROVINCES.length];
        setSelectedProvinceCode(nextProv.code);
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar los escaños provinciales.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProvinces = useMemo(() => {
    return PROVINCES.filter((prov) => {
      const matchesSearch =
        prov.name.toLowerCase().includes(provinceSearch.toLowerCase()) ||
        prov.region.toLowerCase().includes(provinceSearch.toLowerCase()) ||
        prov.code.includes(provinceSearch);
      if (!matchesSearch) return false;
      if (filterMode === 'completed') return completedProvinceCodes.has(prov.code);
      if (filterMode === 'pending') return !completedProvinceCodes.has(prov.code);
      return true;
    });
  }, [provinceSearch, filterMode, completedProvinceCodes]);

  const currentProvIndex = PROVINCES.findIndex((p) => p.code === selectedProvince.code);
  const goPrevProvince = () => {
    const prevIdx = (currentProvIndex - 1 + PROVINCES.length) % PROVINCES.length;
    setSelectedProvinceCode(PROVINCES[prevIdx].code);
    setFeedbackMsg(null);
  };
  const goNextProvince = () => {
    const nextIdx = (currentProvIndex + 1) % PROVINCES.length;
    setSelectedProvinceCode(PROVINCES[nextIdx].code);
    setFeedbackMsg(null);
  };

  const rankingEntries = useMemo(
    () => calculateProvincialRanking(provincialRows, profilesMap, liveResults),
    [provincialRows, profilesMap, liveResults]
  );

  return (
    <div className="space-y-6">
      {/* 1. Resumen superior con Hemiciclo Global Provincial */}
      <HemicycleChart
        title="Resumen Global de tu Porra Provincial (Congreso)"
        subtitle={`Escaños acumulados en tus provincias guardadas (${completedProvinceCodes.size} / 52 circunscripciones completadas)`}
        seatsByParty={globalProvincialSeats}
        parties={CONGRESS_PARTIES}
        totalTargetSeats={TOTAL_CONGRESS_SEATS}
        majoritySeats={CONGRESS_MAJORITY_SEATS}
      />

      {/* 2. Panel de votación provincial (Selector de 52 provincias + D'Hondt dinámico) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna izquierda: Selector rápido de las 52 provincias */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">52 Circunscripciones</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {completedProvinceCodes.size}/52 votadas
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-300"
              style={{ width: `${(completedProvinceCodes.size / 52) * 100}%` }}
            />
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={provinceSearch}
              onChange={(e) => setProvinceSearch(e.target.value)}
              placeholder="Buscar provincia o CC.AA..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtros rápidos */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`py-1.5 rounded-lg transition-colors ${
                filterMode === 'all'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas (52)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('completed')}
              className={`py-1.5 rounded-lg transition-colors ${
                filterMode === 'completed'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hechas ({completedProvinceCodes.size})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`py-1.5 rounded-lg transition-colors ${
                filterMode === 'pending'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({52 - completedProvinceCodes.size})
            </button>
          </div>

          {/* Lista de provincias */}
          <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredProvinces.map((prov) => {
              const isSelected = prov.code === selectedProvince.code;
              const isCompleted = completedProvinceCodes.has(prov.code);

              return (
                <button
                  key={prov.code}
                  type="button"
                  onClick={() => {
                    setSelectedProvinceCode(prov.code);
                    setFeedbackMsg(null);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : isCompleted
                      ? 'bg-emerald-50/70 hover:bg-emerald-100/70 text-slate-800 border border-emerald-200/70'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isCompleted ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-sky-200' : 'text-emerald-600'
                        }`}
                      />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {prov.code}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="text-xs sm:text-sm block truncate">{prov.name}</span>
                      <span
                        className={`text-[10px] block truncate ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {prov.region}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {prov.seats} esc.
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Columna derecha: Calculadora D'Hondt en vivo y votación de la provincia activa */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
          {/* Cabecera con navegación rápida entre provincias */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevProvince}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Provincia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {selectedProvince.region}
                  </span>
                  {completedProvinceCodes.has(selectedProvince.code) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Guardada
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {selectedProvince.name}{' '}
                  <span className="text-base font-semibold text-slate-500">
                    ({selectedProvince.seats}{' '}
                    {selectedProvince.seats === 1 ? 'escaño' : 'escaños'})
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={goNextProvince}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                title="Siguiente provincia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  isOver100
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Suma % voto: <span className="font-extrabold">{sumPct.toFixed(1)}%</span> / 100%
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleResetProvince}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Reiniciar porcentajes de esta provincia"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Resaltado en vivo: Último escaño y Siguiente escaño (D'Hondt 3%) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-sky-50/60 border border-blue-200/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                  Último escaño asignado (#{selectedProvince.seats})
                </span>
                {dhondtResult.lastSeatWinner ? (
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CONGRESS_PARTY_MAP[dhondtResult.lastSeatWinner.partyCode]?.color,
                      }}
                    />
                    <span className="text-sm font-extrabold text-slate-900">
                      {dhondtResult.lastSeatWinner.partyCode}
                    </span>
                    <span className="text-xs text-slate-600">
                      (cociente {dhondtResult.lastSeatWinner.quotient.toFixed(2)}%)
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Asigna al menos un {DHONDT_MIN_THRESHOLD_PCT}% a algún partido.
                  </p>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/50 border border-amber-200/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Siguiente escaño en disputa
                </span>
                {dhondtResult.nextSeatContender ? (
                  <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          CONGRESS_PARTY_MAP[dhondtResult.nextSeatContender.partyCode]?.color,
                      }}
                    />
                    <span className="text-sm font-extrabold text-slate-900">
                      {dhondtResult.nextSeatContender.partyCode}
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      a +{dhondtResult.nextSeatContender.pctDiff.toFixed(2)}% de lograrlo
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-0.5">Sin aspirantes adicionales</p>
                )}
              </div>
            </div>
          </div>

          {/* Sliders sincronizados con inputs numéricos para los partidos de la provincia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                Introduce el <strong>% de voto</strong> (barrera legal mínima D&apos;Hondt:{' '}
                <strong>3.0%</strong>)
              </span>
              <span>Se guardan únicamente los escaños resultantes</span>
            </div>

            <div className="space-y-2.5">
              {selectedProvince.parties.map((partyCode) => {
                const party = CONGRESS_PARTY_MAP[partyCode];
                const pct = currentProvincePcts[partyCode] ?? 0;
                const seatsWon = dhondtResult.seatsByParty[partyCode] ?? 0;
                const isLastWinner =
                  dhondtResult.lastSeatWinner?.partyCode === partyCode;
                const isNextContender =
                  dhondtResult.nextSeatContender?.partyCode === partyCode;
                const belowThreshold = pct > 0 && pct < DHONDT_MIN_THRESHOLD_PCT;

                return (
                  <div
                    key={partyCode}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                      isLastWinner
                        ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-200'
                        : isNextContender
                        ? 'bg-amber-50/35 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: party?.color || '#64748B' }}
                        />
                        <span className="font-bold text-sm text-slate-900">
                          {party?.name || partyCode}
                        </span>

                        {isLastWinner && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-600 text-white">
                            <Award className="w-3 h-3" /> Último escaño
                          </span>
                        )}

                        {isNextContender && dhondtResult.nextSeatContender && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white">
                            <Sparkles className="w-3 h-3" /> Siguiente escaño (+
                            {dhondtResult.nextSeatContender.pctDiff.toFixed(2)}%)
                          </span>
                        )}

                        {belowThreshold && (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            &lt; 3% (sin escaño)
                          </span>
                        )}
                      </div>

                      {/* Escaños resultantes D'Hondt */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-extrabold transition-colors ${
                            seatsWon > 0
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          {seatsWon} {seatsWon === 1 ? 'escaño' : 'escaños'}
                        </span>
                      </div>
                    </div>

                    {/* Control Slider + Input numérico sincronizados */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        disabled={isReadOnly}
                        value={pct}
                        onChange={(e) => handlePctChange(partyCode, Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, ${
                            party?.color || '#2563EB'
                          } 0%, ${party?.color || '#2563EB'} ${pct}%, #E2E8F0 ${pct}%, #E2E8F0 100%)`,
                          borderRadius: '9999px',
                          height: '8px',
                        }}
                        className="w-full"
                        aria-label={`Porcentaje para ${party?.name || partyCode}`}
                      />

                      <div className="relative w-24 shrink-0">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          disabled={isReadOnly}
                          value={pct}
                          onChange={(e) =>
                            handlePctChange(partyCode, parseFloat(e.target.value) || 0)
                          }
                          className="w-full pr-6 pl-2.5 py-1.5 text-right text-sm font-bold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback y botones de guardado */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {feedbackMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {!userId ? (
                <span className="text-amber-700 font-medium">
                  Inicia sesión con Google en la esquina superior para guardar tu voto.
                </span>
              ) : isReadOnly ? (
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <Lock className="w-3.5 h-3.5" /> Porra cerrada (modo solo lectura)
                </span>
              ) : (
                <span>
                  Reparto D&apos;Hondt calculado: <strong>{dhondtResult.totalAllocated}</strong> de{' '}
                  <strong>{selectedProvince.seats}</strong> escaños.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!userId || isReadOnly || isSaving || isOver100}
                onClick={() => handleSave(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Guardando...' : `Guardar ${selectedProvince.name}`}
              </button>

              <button
                type="button"
                disabled={!userId || isReadOnly || isSaving || isOver100}
                onClick={() => handleSave(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
              >
                <span>Guardar y siguiente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Ránking Único Provincial */}
      <RankingCard
        title="Ránking Único Provincial (Congreso)"
        subtitle="Suma total de desviaciones de escaños en las 52 circunscripciones y todos sus partidos (menor desviación gana)"
        entries={rankingEntries}
        unitLabel="escaños"
        currentUserId={userId}
        isLiveAvailable={liveResults.isAvailable}
        onSelectUser={onSelectRankingUser}
        completionLabel="provincias"
      />
    </div>
  );
};
