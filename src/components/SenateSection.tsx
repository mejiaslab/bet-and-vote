import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Save,
} from 'lucide-react';
import { SENATE_PARTIES } from '../constants/elections';
import {
  calculateSenateRanking,
  LiveResultsData,
  SenatePredictionRow,
  UserProfile,
} from '../utils/rankings';
import { HemicycleChart } from './HemicycleChart';
import { RankingCard } from './RankingCard';

interface SenateSectionProps {
  userId?: string;
  isReadOnly: boolean;
  senateRows: SenatePredictionRow[];
  profilesMap: Record<string, UserProfile>;
  liveResults: LiveResultsData;
  onSaveSenateSeats: (seatsByParty: Record<string, number>) => Promise<void>;
  onSelectRankingUser: (userId: string) => void;
}

export const SenateSection: React.FC<SenateSectionProps> = ({
  userId,
  isReadOnly,
  senateRows,
  profilesMap,
  liveResults,
  onSaveSenateSeats,
  onSelectRankingUser,
}) => {
  const [seatsByParty, setSeatsByParty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const p of SENATE_PARTIES) initial[p.code] = 0;
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!userId) return;
    const userRows = senateRows.filter((r) => r.user_id === userId);
    if (userRows.length === 0) return;

    const loaded: Record<string, number> = {};
    for (const p of SENATE_PARTIES) loaded[p.code] = 0;
    for (const row of userRows) {
      loaded[row.party_code] = Number(row.seats) || 0;
    }
    setSeatsByParty(loaded);
  }, [senateRows, userId]);

  const totalSenateSeats = useMemo(
    () => Object.values(seatsByParty).reduce((acc, val) => acc + (Number(val) || 0), 0),
    [seatsByParty]
  );

  const handleSeatChange = (partyCode: string, newSeats: number) => {
    if (isReadOnly) return;
    const sanitized = Math.max(0, Math.min(266, Math.round(newSeats)));
    setSeatsByParty((prev) => ({
      ...prev,
      [partyCode]: sanitized,
    }));
    setFeedbackMsg(null);
  };

  const handleReset = () => {
    if (isReadOnly) return;
    const empty: Record<string, number> = {};
    for (const p of SENATE_PARTIES) empty[p.code] = 0;
    setSeatsByParty(empty);
    setFeedbackMsg(null);
  };

  const handleSave = async () => {
    if (!userId || isReadOnly) return;
    if (totalSenateSeats <= 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Introduce al menos un escaño antes de guardar tu Porra del Senado.',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveSenateSeats(seatsByParty);
      setFeedbackMsg({
        type: 'ok',
        text: '¡Tu Porra del Senado se ha guardado correctamente!',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la porra del Senado.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rankingEntries = useMemo(
    () => calculateSenateRanking(senateRows, profilesMap, liveResults),
    [senateRows, profilesMap, liveResults]
  );

  return (
    <div className="space-y-6">
      {/* 1. Hemiciclo del Senado */}
      <HemicycleChart
        title="Porra del Senado · Cámara Alta"
        subtitle="Pronóstico de escaños a nivel estatal para los 7 partidos del Senado"
        seatsByParty={seatsByParty}
        parties={SENATE_PARTIES}
        totalTargetSeats={Math.max(208, totalSenateSeats)}
        majoritySeats={105}
      />

      {/* 2. Introducción directa de escaños para los 7 partidos del Senado */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Escaños del Senado (7 Partidos)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Introduce directamente los escaños para PP, Senado de Progreso, VOX, ERC, Junts, PNV y EH Bildu.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              Total asignado: {totalSenateSeats} escaños
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reiniciar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SENATE_PARTIES.map((party) => {
            const seats = seatsByParty[party.code] ?? 0;
            const sliderMax = 180;
            const barPct = Math.min(100, (seats / sliderMax) * 100);

            return (
              <div
                key={party.code}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {party.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isReadOnly || seats <= 0}
                      onClick={() => handleSeatChange(party.code, seats - 1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={266}
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
                      disabled={isReadOnly || seats >= 266}
                      onClick={() => handleSeatChange(party.code, seats + 1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
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
                  onChange={(e) =>
                    handleSeatChange(party.code, parseInt(e.target.value, 10) || 0)
                  }
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
                Inicia sesión con Google para guardar tu Porra del Senado.
              </span>
            ) : isReadOnly ? (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5" /> Porra cerrada (modo solo lectura)
              </span>
            ) : (
              <span>
                Puedes modificar tu voto todas las veces que quieras hasta el cierre del 29N a las 09:00h.
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!userId || isReadOnly || isSaving}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Porra del Senado'}
          </button>
        </div>
      </div>

      {/* 3. Ránking del Senado */}
      <RankingCard
        title="Ránking del Senado (Estatal por Escaños)"
        subtitle="Suma de las desviaciones absolutas de escaños de los 7 partidos del Senado (menor desviación gana)"
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
