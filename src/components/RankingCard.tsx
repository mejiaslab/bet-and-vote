import React from 'react';
import { Clock, Eye, Medal, Trophy, Users } from 'lucide-react';
import { RankingEntry } from '../utils/rankings';

interface RankingCardProps {
  title: string;
  subtitle: string;
  entries: RankingEntry[];
  unitLabel: 'escaños' | 'pts %';
  currentUserId?: string;
  isLiveAvailable: boolean;
  onSelectUser: (userId: string) => void;
  completionLabel?: string;
}

export const RankingCard: React.FC<RankingCardProps> = ({
  title,
  subtitle,
  entries,
  unitLabel,
  currentUserId,
  isLiveAvailable,
  onSelectUser,
  completionLabel,
}) => {
  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-sky-50/40 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            {entries.length} {entries.length === 1 ? 'participante' : 'participantes'}
          </span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-slate-600">
            Todavía no hay apuestas registradas en esta sección.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ¡Sé el primero en guardar tu pronóstico para liderar el ránking!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = currentUserId === entry.userId;

            return (
              <button
                key={entry.userId}
                type="button"
                onClick={() => onSelectUser(entry.userId)}
                className={`w-full text-left px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 transition-colors hover:bg-blue-50/50 focus:outline-none focus:bg-blue-50/60 ${
                  isCurrentUser ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Posición */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : rank === 2
                        ? 'bg-slate-200 text-slate-800 border border-slate-300'
                        : rank === 3
                        ? 'bg-orange-100 text-orange-800 border border-orange-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {rank <= 3 ? <Medal className="w-4 h-4" /> : `#${rank}`}
                  </div>

                  {/* Avatar */}
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt={entry.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {entry.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Nombre y metadatos */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 truncate underline-offset-2 hover:underline">
                        {entry.fullName}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-blue-600 text-white">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(entry.updatedAt)}
                      </span>
                      {completionLabel && (
                        <span className="text-slate-400">
                          • {entry.completedCount}/{entry.totalCount} {completionLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desviación y botón ver detalle */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Desviación
                    </div>
                    <div
                      className={`text-sm sm:text-base font-extrabold ${
                        !isLiveAvailable
                          ? 'text-slate-600'
                          : entry.deviation === 0
                          ? 'text-emerald-600'
                          : 'text-blue-700'
                      }`}
                    >
                      {unitLabel === 'pts %'
                        ? `${entry.deviation.toFixed(2)} pts`
                        : `${entry.deviation} ${unitLabel}`}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
