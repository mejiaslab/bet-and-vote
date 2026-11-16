import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  CONGRESS_PARTIES,
  PROVINCES,
  SENATE_PARTIES,
} from '../constants/elections';
import {
  LiveResultsData,
  NationalPctPredictionRow,
  NationalSeatPredictionRow,
  ProvincialPredictionRow,
  SenatePredictionRow,
  UserProfile,
} from '../utils/rankings';
import { HemicycleChart } from './HemicycleChart';

export type SectionType = 'provincial' | 'national_seats' | 'national_pct' | 'senate';

interface UserVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: SectionType;
  userId: string | null;
  profile?: UserProfile;
  provincialRows: ProvincialPredictionRow[];
  nationalSeatRows: NationalSeatPredictionRow[];
  nationalPctRows: NationalPctPredictionRow[];
  senateRows: SenatePredictionRow[];
  liveResults: LiveResultsData;
}

export const UserVoteModal: React.FC<UserVoteModalProps> = ({
  isOpen,
  onClose,
  section,
  userId,
  profile,
  provincialRows,
  nationalSeatRows,
  nationalPctRows,
  senateRows,
  liveResults,
}) => {
  const [provSearch, setProvSearch] = useState('');

  const userProvRows = useMemo(
    () => provincialRows.filter((r) => r.user_id === userId),
    [provincialRows, userId]
  );

  const userNatSeatRows = useMemo(
    () => nationalSeatRows.filter((r) => r.user_id === userId),
    [nationalSeatRows, userId]
  );

  const userNatPctRows = useMemo(
    () => nationalPctRows.filter((r) => r.user_id === userId),
    [nationalPctRows, userId]
  );

  const userSenateRows = useMemo(
    () => senateRows.filter((r) => r.user_id === userId),
    [senateRows, userId]
  );

  // Acumulado provincial de escaños del usuario seleccionado
  const provincialAccumulatedSeats = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of CONGRESS_PARTIES) map[p.code] = 0;
    for (const row of userProvRows) {
      map[row.party_code] = (map[row.party_code] ?? 0) + (Number(row.seats) || 0);
    }
    return map;
  }, [userProvRows]);

  const provincialByProvince = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const row of userProvRows) {
      if (!map[row.province_code]) map[row.province_code] = {};
      map[row.province_code][row.party_code] = Number(row.seats) || 0;
    }
    return map;
  }, [userProvRows]);

  const nationalSeatsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of userNatSeatRows) {
      map[row.party_code] = Number(row.seats) || 0;
    }
    return map;
  }, [userNatSeatRows]);

  const nationalPctMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of userNatPctRows) {
      map[row.party_code] = Number(row.percentage) || 0;
    }
    return map;
  }, [userNatPctRows]);

  const senateSeatsMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of userSenateRows) {
      map[row.party_code] = Number(row.seats) || 0;
    }
    return map;
  }, [userSenateRows]);

  if (!isOpen || !userId) return null;

  const userName = profile?.full_name || `Usuario ${userId.slice(0, 6)}`;

  const sectionTitles: Record<SectionType, string> = {
    provincial: 'Desglose · Porra Provincial (Congreso)',
    national_seats: 'Desglose · Porra Estatal por Escaños (Congreso)',
    national_pct: 'Desglose · Porra Estatal por Porcentaje (Congreso)',
    senate: 'Desglose · Porra del Senado (Estatal por Escaños)',
  };

  const filteredProvinces = PROVINCES.filter(
    (p) =>
      p.name.toLowerCase().includes(provSearch.toLowerCase()) ||
      p.region.toLowerCase().includes(provSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-sky-500 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 text-white font-extrabold flex items-center justify-center shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold truncate">{userName}</h2>
              <p className="text-xs text-blue-100 truncate">{sectionTitles[section]}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {section === 'provincial' && (
            <>
              <HemicycleChart
                title={`Hemiciclo Provincial Acumulado de ${userName}`}
                subtitle="Suma de los escaños pronosticados en las 52 circunscripciones"
                seatsByParty={provincialAccumulatedSeats}
                parties={CONGRESS_PARTIES}
                totalTargetSeats={350}
                majoritySeats={176}
                compact
              />

              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">
                    Desglose en las 52 circunscripciones
                  </h4>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={provSearch}
                      onChange={(e) => setProvSearch(e.target.value)}
                      placeholder="Buscar provincia..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProvinces.map((prov) => {
                    const userProv = provincialByProvince[prov.code] || {};
                    const realProv = liveResults.provincialSeats[prov.code] || {};
                    const provDeviation = prov.parties.reduce((acc, partyCode) => {
                      return acc + Math.abs((userProv[partyCode] ?? 0) - (realProv[partyCode] ?? 0));
                    }, 0);

                    return (
                      <div
                        key={prov.code}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm text-slate-900">{prov.name}</span>
                            <span className="ml-2 text-xs text-slate-500">
                              ({prov.seats} {prov.seats === 1 ? 'escaño' : 'escaños'})
                            </span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Desv: {provDeviation}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {prov.parties.map((partyCode) => {
                            const party = CONGRESS_PARTIES.find((p) => p.code === partyCode);
                            const uSeats = userProv[partyCode] ?? 0;
                            const rSeats = realProv[partyCode] ?? 0;
                            const diff = Math.abs(uSeats - rSeats);

                            return (
                              <div
                                key={partyCode}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: party?.color || '#64748B' }}
                                />
                                <span className="font-semibold text-slate-700">{partyCode}:</span>
                                <span className="font-extrabold text-slate-900">{uSeats}</span>
                                {liveResults.isAvailable && (
                                  <span className="text-[10px] text-slate-400">
                                    (real {rSeats}, Δ{diff})
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {section === 'national_seats' && (
            <>
              <HemicycleChart
                title={`Hemiciclo Nacional de ${userName}`}
                subtitle="Pronóstico directo de los 350 escaños del Congreso"
                seatsByParty={nationalSeatsMap}
                parties={CONGRESS_PARTIES}
                totalTargetSeats={350}
                majoritySeats={176}
                compact
              />

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2.5 px-4">Partido</th>
                      <th className="py-2.5 px-4 text-right">Voto Usuario</th>
                      <th className="py-2.5 px-4 text-right">Resultado Real</th>
                      <th className="py-2.5 px-4 text-right">Desviación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CONGRESS_PARTIES.map((party) => {
                      const uSeats = nationalSeatsMap[party.code] ?? 0;
                      const rSeats = liveResults.nationalSeats[party.code] ?? 0;
                      const diff = Math.abs(uSeats - rSeats);
                      return (
                        <tr key={party.code} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: party.color }}
                            />
                            {party.name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {uSeats} escaños
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {rSeats} escaños
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-blue-700">
                            {diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === 'national_pct' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                    <th className="py-2.5 px-4">Partido</th>
                    <th className="py-2.5 px-4 text-right">% Usuario</th>
                    <th className="py-2.5 px-4 text-right">% Oficial</th>
                    <th className="py-2.5 px-4 text-right">Desviación (pts)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CONGRESS_PARTIES.map((party) => {
                    const uPct = nationalPctMap[party.code] ?? 0;
                    const rPct = liveResults.nationalPct[party.code] ?? 0;
                    const diff = Math.abs(uPct - rPct);
                    return (
                      <tr key={party.code} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: party.color }}
                          />
                          {party.name}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                          {uPct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {rPct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-blue-700">
                          {diff.toFixed(2)} pts
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {section === 'senate' && (
            <>
              <HemicycleChart
                title={`Cámara del Senado de ${userName}`}
                subtitle="Escaños pronosticados para los 7 partidos del Senado"
                seatsByParty={senateSeatsMap}
                parties={SENATE_PARTIES}
                totalTargetSeats={208}
                majoritySeats={0}
                compact
              />

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                      <th className="py-2.5 px-4">Partido (Senado)</th>
                      <th className="py-2.5 px-4 text-right">Escaños Usuario</th>
                      <th className="py-2.5 px-4 text-right">Escaños Reales</th>
                      <th className="py-2.5 px-4 text-right">Desviación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SENATE_PARTIES.map((party) => {
                      const uSeats = senateSeatsMap[party.code] ?? 0;
                      const rSeats = liveResults.senateSeats[party.code] ?? 0;
                      const diff = Math.abs(uSeats - rSeats);
                      return (
                        <tr key={party.code} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: party.color }}
                            />
                            {party.name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {uSeats} escaños
                          </td>
                          <td className="py-2.5 px-4 text-right text-slate-600">
                            {rSeats} escaños
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-blue-700">
                            {diff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            Cerrar desglose
          </button>
        </div>
      </div>
    </div>
  );
};
