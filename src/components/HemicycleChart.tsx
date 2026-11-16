import React, { useMemo } from 'react';
import { PartyConfig } from '../constants/elections';

interface HemicycleChartProps {
  title: string;
  subtitle?: string;
  seatsByParty: Record<string, number>;
  parties: PartyConfig[];
  totalTargetSeats?: number;
  majoritySeats?: number;
  compact?: boolean;
}

interface SeatDot {
  x: number;
  y: number;
  angle: number;
  color: string;
  partyName: string;
}

export const HemicycleChart: React.FC<HemicycleChartProps> = ({
  title,
  subtitle,
  seatsByParty,
  parties,
  totalTargetSeats = 350,
  majoritySeats = 176,
  compact = false,
}) => {
  const totalAllocated = useMemo(
    () =>
      parties.reduce((acc, p) => acc + Math.max(0, Math.round(seatsByParty[p.code] ?? 0)), 0),
    [parties, seatsByParty]
  );

  const effectiveTotalSeats = Math.max(totalTargetSeats, totalAllocated, 1);

  const seatDots = useMemo(() => {
    const rows = compact ? 7 : 9;
    const innerRadius = 58;
    const outerRadius = 152;
    const centerX = 180;
    const centerY = 165;

    const radii: number[] = [];
    for (let r = 0; r < rows; r++) {
      radii.push(innerRadius + ((outerRadius - innerRadius) * r) / Math.max(1, rows - 1));
    }

    const totalRadiusSum = radii.reduce((a, b) => a + b, 0);
    const seatsPerRow = radii.map((rad) =>
      Math.max(1, Math.round((rad / totalRadiusSum) * effectiveTotalSeats))
    );

    // Ajustar diferencia de redondeo en la fila exterior
    const currentSum = seatsPerRow.reduce((a, b) => a + b, 0);
    seatsPerRow[seatsPerRow.length - 1] += effectiveTotalSeats - currentSum;

    const rawPositions: { x: number; y: number; angle: number }[] = [];
    seatsPerRow.forEach((count, rIdx) => {
      const radius = radii[rIdx];
      for (let i = 0; i < count; i++) {
        const fraction = count === 1 ? 0.5 : i / (count - 1);
        const angle = Math.PI * (1 - fraction); // de PI (izquierda) a 0 (derecha)
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);
        rawPositions.push({ x, y, angle });
      }
    });

    // Ordenar de izquierda a derecha (ángulo descendente de PI a 0)
    rawPositions.sort((a, b) => b.angle - a.angle);

    // Construir lista de colores según escaños por partido
    const partyColors: { color: string; name: string }[] = [];
    for (const party of parties) {
      const count = Math.max(0, Math.round(seatsByParty[party.code] ?? 0));
      for (let i = 0; i < count; i++) {
        partyColors.push({ color: party.color, name: party.name });
      }
    }

    return rawPositions.map<SeatDot>((pos, idx) => {
      const assigned = partyColors[idx];
      return {
        ...pos,
        color: assigned ? assigned.color : '#E2E8F0',
        partyName: assigned ? assigned.name : 'Sin asignar',
      };
    });
  }, [compact, effectiveTotalSeats, parties, seatsByParty]);

  const partiesWithSeats = useMemo(
    () =>
      parties
        .map((p) => ({
          ...p,
          seats: Math.max(0, Math.round(seatsByParty[p.code] ?? 0)),
        }))
        .filter((p) => p.seats > 0)
        .sort((a, b) => b.seats - a.seats),
    [parties, seatsByParty]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Total: {totalAllocated} / {totalTargetSeats} escaños
          </span>
          {majoritySeats > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              Mayoría: {majoritySeats}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* SVG del Hemiciclo */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <svg
            viewBox="0 0 360 185"
            className="w-full max-w-[380px] h-auto overflow-visible"
            role="img"
            aria-label={title}
          >
            {/* Línea de mayoría absoluta en el centro */}
            {majoritySeats > 0 && (
              <g>
                <line
                  x1="180"
                  y1="6"
                  x2="180"
                  y2="122"
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <rect x="136" y="0" width="88" height="16" rx="8" fill="#F1F5F9" />
                <text
                  x="180"
                  y="11"
                  textAnchor="middle"
                  className="fill-slate-600 text-[8.5px] font-semibold"
                >
                  Mayoría ({majoritySeats})
                </text>
              </g>
            )}

            {/* Puntos de escaños */}
            {seatDots.map((dot, index) => (
              <circle
                key={index}
                cx={dot.x}
                cy={dot.y}
                r={effectiveTotalSeats > 280 ? 3.2 : 3.8}
                fill={dot.color}
                className="transition-colors duration-200"
              >
                <title>{dot.partyName}</title>
              </circle>
            ))}

            {/* Número central en el arco */}
            <text
              x="180"
              y="148"
              textAnchor="middle"
              className="fill-slate-900 text-2xl font-extrabold"
            >
              {totalAllocated}
            </text>
            <text
              x="180"
              y="163"
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-medium uppercase tracking-wider"
            >
              Escaños asignados
            </text>
          </svg>

          {/* Barra de proporción con marca de mayoría */}
          <div className="w-full mt-2">
            <div className="relative h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/70">
              {partiesWithSeats.map((p) => {
                const widthPct = (p.seats / effectiveTotalSeats) * 100;
                return (
                  <div
                    key={p.code}
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: p.color,
                    }}
                    title={`${p.name}: ${p.seats} escaños`}
                    className="h-full transition-all duration-300"
                  />
                );
              })}
              {majoritySeats > 0 && majoritySeats < effectiveTotalSeats && (
                <div
                  style={{ left: `${(majoritySeats / effectiveTotalSeats) * 100}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                  title={`Mayoría absoluta: ${majoritySeats} escaños`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Desglose de partidos con escaños */}
        <div className="lg:col-span-6">
          {partiesWithSeats.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-sm">
              Aún no hay escaños asignados en este hemiciclo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {partiesWithSeats.map((party) => (
                <div
                  key={party.code}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50/90 border border-slate-200/80"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate" title={party.name}>
                      {party.name}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900 shrink-0">
                    {party.seats}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
