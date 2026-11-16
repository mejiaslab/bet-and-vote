import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Lock,
  RotateCcw,
  Save,
} from 'lucide-react';
import { CONGRESS_PARTIES } from '../constants/elections';
import {
  calculateNationalPctRanking,
  LiveResultsData,
  NationalPctPredictionRow,
  UserProfile,
} from '../utils/rankings';
import { RankingCard } from './RankingCard';

interface NationalPctSectionProps {
  userId?: string;
  isReadOnly: boolean;
  nationalPctRows: NationalPctPredictionRow[];
  profilesMap: Record<string, UserProfile>;
  liveResults: LiveResultsData;
  onSaveNationalPct: (pctByParty: Record<string, number>) => Promise<void>;
  onSelectRankingUser: (userId: string) => void;
}

export const NationalPctSection: React.FC<NationalPctSectionProps> = ({
  userId,
  isReadOnly,
  nationalPctRows,
  profilesMap,
  liveResults,
  onSaveNationalPct,
  onSelectRankingUser,
}) => {
  const [pctByParty, setPctByParty] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) initial[p.code] = 0;
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!userId) return;
    const userRows = nationalPctRows.filter((r) => r.user_id === userId);
    if (userRows.length === 0) return;

    const loaded: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) loaded[p.code] = 0;
    for (const row of userRows) {
      loaded[row.party_code] = Number(row.percentage) || 0;
    }
    setPctByParty(loaded);
  }, [nationalPctRows, userId]);

  const totalPct = useMemo(
    () =>
      Number(
        Object.values(pctByParty)
          .reduce((acc, val) => acc + (Number(val) || 0), 0)
          .toFixed(2)
      ),
    [pctByParty]
  );

  const isOver100 = totalPct > 100.001;
  const remainingPct = Math.max(0, Number((100 - totalPct).toFixed(2)));

  const handlePctChange = (partyCode: string, rawVal: number) => {
    if (isReadOnly) return;
    const clamped = Math.max(0, Math.min(100, Number(rawVal.toFixed(2))));

    setPctByParty((prev) => {
      const otherSum = CONGRESS_PARTIES.filter((p) => p.code !== partyCode).reduce(
        (acc, p) => acc + (prev[p.code] ?? 0),
        0
      );
      const maxAllowed = Math.max(0, Number((100 - otherSum).toFixed(2)));
      return {
        ...prev,
        [partyCode]: Math.min(clamped, maxAllowed),
      };
    });
    setFeedbackMsg(null);
  };

  const handleReset = () => {
    if (isReadOnly) return;
    const empty: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) empty[p.code] = 0;
    setPctByParty(empty);
    setFeedbackMsg(null);
  };

  const handleSave = async () => {
    if (!userId || isReadOnly) return;
    if (isOver100) {
      setFeedbackMsg({
        type: 'error',
        text: `La suma de porcentajes no puede superar el 100% (actualmente: ${totalPct.toFixed(2)}%).`,
      });
      return;
    }
    if (totalPct <= 0) {
      setFeedbackMsg({
        type: 'error',
        text: 'Introduce algún porcentaje de voto antes de guardar.',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await onSaveNationalPct(pctByParty);
      setFeedbackMsg({
        type: 'ok',
        text: '¡Tu Porra Estatal por Porcentaje se ha guardado correctamente!',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar la porra de porcentajes.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const rankingEntries = useMemo(
    () => calculateNationalPctRanking(nationalPctRows, profilesMap, liveResults),
    [nationalPctRows, profilesMap, liveResults]
  );

  const sortedPartiesForChart = useMemo(
    () =>
      CONGRESS_PARTIES.map((p) => ({
        ...p,
        pct: pctByParty[p.code] ?? 0,
      })).filter((p) => p.pct > 0),
    [pctByParty]
  );

  return (
    <div className="space-y-6">
      {/* 1. Resumen visual de barra nacional de porcentajes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Distribución Nacional de Voto (%)
              </h3>
              <p className="text-xs text-slate-500">
                Pronóstico de porcentaje de voto estatal para los 16 partidos del Congreso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                isOver100
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              Asignado: {totalPct.toFixed(2)}%
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              Otros / Blanco: {remainingPct.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
          {sortedPartiesForChart.map((p) => (
            <div
              key={p.code}
              style={{
                width: `${Math.min(100, p.pct)}%`,
                backgroundColor: p.color,
              }}
              title={`${p.name}: ${p.pct.toFixed(2)}%`}
              className="h-full transition-all duration-200"
            />
          ))}
        </div>

        {sortedPartiesForChart.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortedPartiesForChart.map((p) => (
              <span
                key={p.code}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-semibold text-slate-700">{p.name}</span>
                <span className="font-extrabold text-slate-900">{p.pct.toFixed(1)}%</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. Sliders e inputs de porcentaje (0.0% a 100.0%) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Porcentaje de Voto por Partido (0.0% – 100.0%)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              La suma total de los 16 partidos no puede superar el 100%.
            </p>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleReset}
              className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar porcentajes
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CONGRESS_PARTIES.map((party) => {
            const pct = pctByParty[party.code] ?? 0;
            const sliderMax = 60;
            const barPct = Math.min(100, (pct / sliderMax) * 100);

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

                  <div className="relative w-24 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      disabled={isReadOnly}
                      value={pct}
                      onChange={(e) =>
                        handlePctChange(party.code, parseFloat(e.target.value) || 0)
                      }
                      className="w-full pr-6 pl-2.5 py-1 text-right text-sm font-extrabold text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={0.1}
                  disabled={isReadOnly}
                  value={Math.min(pct, sliderMax)}
                  onChange={(e) =>
                    handlePctChange(party.code, parseFloat(e.target.value) || 0)
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
                Inicia sesión con Google para guardar tu Porra Estatal de Porcentajes.
              </span>
            ) : isReadOnly ? (
              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                <Lock className="w-3.5 h-3.5" /> Porra cerrada (modo solo lectura)
              </span>
            ) : (
              <span>
                Suma actual: <strong>{totalPct.toFixed(2)}%</strong> (máximo permitido: 100.0%).
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!userId || isReadOnly || isSaving || isOver100}
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar Porra de Porcentajes'}
          </button>
        </div>
      </div>

      {/* 3. Ránking Estatal de Porcentajes */}
      <RankingCard
        title="Ránking Estatal de Porcentajes (Congreso)"
        subtitle="Suma de desviaciones absolutas en puntos porcentuales de los 16 partidos (menor desviación gana)"
        entries={rankingEntries}
        unitLabel="pts %"
        currentUserId={userId}
        isLiveAvailable={liveResults.isAvailable}
        onSelectUser={onSelectRankingUser}
        completionLabel="partidos"
      />
    </div>
  );
};
