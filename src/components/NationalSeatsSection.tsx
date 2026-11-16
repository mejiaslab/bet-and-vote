import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  CONGRESS_MAJORITY_SEATS,
  CONGRESS_PARTIES,
  TOTAL_CONGRESS_SEATS,
} from '../constants/elections';
import {
  calculateNationalSeatsRanking,
  LiveResultsData,
  NationalSeatPredictionRow,
  ProvincialPredictionRow,
  UserProfile,
} from '../utils/rankings';
import { HemicycleChart } from './HemicycleChart';
import { RankingCard } from './RankingCard';

interface NationalSeatsSectionProps {
  userId?: string;
  isReadOnly: boolean;
  nationalSeatRows: NationalSeatPredictionRow[];
  provincialRows: ProvincialPredictionRow[];
  profilesMap: Record<string, UserProfile>;
  liveResults: LiveResultsData;
  onSaveNationalSeats: (seatsByParty: Record<string, number>) => Promise<void>;
  onSelectRankingUser: (userId: string) => void;
}

export const NationalSeatsSection: React.FC<NationalSeatsSectionProps> = ({
  userId,
  isReadOnly,
  nationalSeatRows,
  provincialRows,
  profilesMap,
  liveResults,
  onSaveNationalSeats,
  onSelectRankingUser,
}) => {
  const [seatsByParty, setSeatsByParty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) initial[p.code] = 0;
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null
  );

  // Cargar predicción guardada del usuario
  useEffect(() => {
    if (!userId) return;
    const userRows = nationalSeatRows.filter((r) => r.user_id === userId);
    if (userRows.length === 0) return;

    const loaded: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) loaded[p.code] = 0;
    for (const row of userRows) {
      loaded[row.party_code] = Number(row.seats) || 0;
    }
    setSeatsByParty(loaded);
  }, [nationalSeatRows, userId]);

  const totalSeats = useMemo(
    () => Object.values(seatsByParty).reduce((acc, val) => acc + (Number(val) || 0), 0),
    [seatsByParty]
  );

  const remainingSeats = TOTAL_CONGRESS_SEATS - totalSeats;
  const isExact350 = totalSeats === TOTAL_CONGRESS_SEATS;

  const handleSeatChange = (partyCode: string, newSeats: number) => {
    if (isReadOnly) return;
    const sanitized = Math.max(0, Math.min(TOTAL_CONGRESS_SEATS, Math.round(newSeats)));
    setSeatsByParty((prev) => ({
      ...prev,
      [partyCode]: sanitized,
    }));
    setFeedbackMsg(null);
  };

  const handleCopyFromProvincial = () => {
    if (!userId || isReadOnly) return;
    const userProv = provincialRows.filter((r) => r.user_id === userId);
    if (userProv.length === 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Todavía no tienes escaños guardados en la Porra Provincial para importar.',
      });
      return;
    }
    const accumulated: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) accumulated[p.code] = 0;
    for (const row of userProv) {
      accumulated[row.party_code] =
        (accumulated[row.party_code] ?? 0) + (Number(row.seats) || 0);
    }
    setSeatsByParty(accumulated);
    setFeedbackMsg({
      type: 'ok',
      text: 'Se ha importado la suma actual de tu Porra Provincial.',
    });
  };

  const handleReset = () => {
    if (isReadOnly) return;
    const empty: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) empty[p.code] = 0;
    setSeatsByParty(empty);
    setFeedbackMsg(null);
  };

  const handleSave = async () => {
    if (!userId || isReadOnly) return;
    if (!isExact350) {
      setFeedbackMsg({
        type: 'error',
        text: `La suma total debe ser exactamente ${TOTAL_CONGRESS_SEATS} escaños (actualmente: ${totalSeats}).`,
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveNationalSeats(seatsByParty);
      setFeedbackMsg({
        type: 'ok',
        text: '¡Tu Porra Estatal por Escaños (350 escaños) se ha guardado correctamente!',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la porra estatal de escaños.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rankingEntries = useMemo(
    () => calculateNationalSeatsRanking(nationalSeatRows, profilesMap, liveResults),
    [nationalSeatRows, profilesMap, liveResults]
  );

  return (
    <div className="space-y-6">
      {/* 1. Hemiciclo con mayoría absoluta en 176 */}
      <HemicycleChart
        title="Porra Estatal por Escaños · Hemiciclo del Congreso"
        subtitle="Introduce directamente los escaños nacionales de los 16 partidos (deben sumar exactamente 350 escaños; mayoría absoluta en 176)"
        seatsByParty={seatsByParty}
        parties={CONGRESS_PARTIES}
        totalTargetSeats={TOTAL_CONGRESS_SEATS}
        majoritySeats={CONGRESS_MAJORITY_SEATS}
      />

      {/* 2. Panel de introducción directa de escaños para los 16 partidos */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Reparto Nacional de Escaños (16 Partidos)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Ajusta con los sliders o escribe el número exacto de escaños para cada formación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${
                isExact350
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : remainingSeats > 0
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-red-50 text-red-700 border-red-300'
              }`}
            >
              Total: {totalSeats} / {TOTAL_CONGRESS_SEATS} escaños{' '}
              {!isExact350 &&
                (remainingSeats > 0
                  ? `(faltan ${remainingSeats})`
                  : `(sobran ${Math.abs(remainingSeats)})`)}
            </div>

            {!isReadOnly && userId && (
              <button
                type="button"
                onClick={handleCopyFromProvincial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                title="Copiar la suma de escaños de tu Porra Provincial"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar de Provincial
              </button>
            )}

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONGRESS_PARTIES.map((party) => {
            const seats = seatsByParty[party.code] ?? 0;
            const sliderMax = 200;
            const barPct = Math.min(100, (seats / sliderMax) * 100);

            return (
              <div
                key={party.code}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {party.name}
                    </span>
                    {party.prev2023 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/75 text-slate-700 border border-slate-300/70">
                        23J{party.prev2023.note ? ` (${party.prev2023.note})` : ''}:{' '}
                        {party.prev2023.seats} esc.
                        {typeof party.prev2023.pct === 'number'
                          ? ` (${party.prev2023.pct.toFixed(2).replace('.', ',')}%)`
                          : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isReadOnly || seats <= 0}
                      onClick={() => handleSeatChange(party.code, seats - 1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label={`Restar 1 escaño a ${party.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={350}
                      step={1}
                      disabled={isReadOnly}
                      value={seats}
                      onChange={(e) =>
                        handleSeatChange(party.code, parseInt(e.target.value, 10) || 0)
                      }
                      className="w-16 px-2 py-1 text-center text-sm font-extrabold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isReadOnly || seats >= 350}
                      onClick={() => handleSeatChange(party.code, seats + 1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      aria-label={`Sumar 1 escaño a ${party.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={1}
                  disabled={isReadOnly}
                  value={Math.min(seats, sliderMax)}
                  onChange={(e) => handleSeatChange(party.code, parseInt(e.target.value, 10) || 0)}
                  style={{
                    background: `linear-gradient(to right, ${party.color} 0%, ${party.color} ${barPct}%, #E2E8F0 ${barPct}%, #E2E8F0 100%)`,
                    borderRadius: '9999px',
                    height: '8px',
                  }}
                  className="w-full"
                />
              </div>
            );
          })}
        </div>

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
                Inicia sesión con Google para guardar tu Porra Estatal de Escaños.
              </span>
            ) : isReadOnly ? (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5" /> Porra cerrada (modo solo lectura)
              </span>
            ) : (
              <span>
                Para guardar, la suma de los 16 partidos debe ser exactamente{' '}
                <strong>350 escaños</strong>.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!userId || isReadOnly || isSaving || !isExact350}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Porra Estatal (350 escaños)'}
          </button>
        </div>
      </div>

      {/* 3. Ránking Estatal de Escaños */}
      <RankingCard
        title="Ránking Estatal de Escaños (Congreso)"
        subtitle="Suma de las desviaciones absolutas de escaños de los 16 partidos nacionales (menor desviación gana)"
        entries={rankingEntries}
        unitLabel="escaños"
        currentUserId={userId}
        isLiveAvailable={liveResults.isAvailable}
        onSelectUser={onSelectRankingUser}
        completionLabel="partidos"
      />
    </div>
  );
};
