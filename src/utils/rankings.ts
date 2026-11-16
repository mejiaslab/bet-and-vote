import {
  CONGRESS_PARTIES,
  PROVINCES,
  SENATE_PARTIES,
} from '../constants/elections';

export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface ProvincialPredictionRow {
  id?: string;
  user_id: string;
  province_code: string;
  party_code: string;
  seats: number;
  updated_at: string;
}

export interface NationalSeatPredictionRow {
  id?: string;
  user_id: string;
  party_code: string;
  seats: number;
  updated_at: string;
}

export interface NationalPctPredictionRow {
  id?: string;
  user_id: string;
  party_code: string;
  percentage: number;
  updated_at: string;
}

export interface SenatePredictionRow {
  id?: string;
  user_id: string;
  party_code: string;
  seats: number;
  updated_at: string;
}

export interface LiveResultsData {
  isAvailable: boolean;
  scrutinyPct: number;
  updatedAt: string | null;
  sourceLabel: string;
  // Mapa province_code -> party_code -> seats
  provincialSeats: Record<string, Record<string, number>>;
  // Mapa party_code -> seats (16 partidos Congreso)
  nationalSeats: Record<string, number>;
  // Mapa party_code -> percentage (16 partidos Congreso)
  nationalPct: Record<string, number>;
  // Mapa party_code -> seats (7 partidos Senado)
  senateSeats: Record<string, number>;
}

export interface RankingEntry {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  deviation: number;
  updatedAt: string;
  completedCount: number; // ej. nº de provincias votadas o partidos rellenados
  totalCount: number;
}

function compareRankingEntries(a: RankingEntry, b: RankingEntry): number {
  // 1. Ordenación de menor a mayor desviación (ASC)
  if (Math.abs(a.deviation - b.deviation) > 1e-6) {
    return a.deviation - b.deviation;
  }
  // 2. Desempate: quien haya guardado su voto antes (updated_at más antiguo)
  const timeA = Date.parse(a.updatedAt) || Number.MAX_SAFE_INTEGER;
  const timeB = Date.parse(b.updatedAt) || Number.MAX_SAFE_INTEGER;
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  return a.fullName.localeCompare(b.fullName, 'es');
}

/**
 * Ránking Sección 1: Porra Provincial
 * Desviación Provincial Total = SUM_provincias( SUM_partidos( |escaños_usuario - escaños_reales| ) )
 * Itera siempre sobre las 52 provincias y todos sus partidos oficiales, tomando 0 si el usuario dejó alguno sin asignar.
 */
export function calculateProvincialRanking(
  rows: ProvincialPredictionRow[],
  profilesMap: Record<string, UserProfile>,
  liveResults: LiveResultsData
): RankingEntry[] {
  const byUser: Record<
    string,
    {
      provinces: Record<string, Record<string, number>>;
      votedProvinces: Set<string>;
      latestUpdatedAt: string;
    }
  > = {};

  for (const row of rows) {
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = {
        provinces: {},
        votedProvinces: new Set(),
        latestUpdatedAt: row.updated_at,
      };
    }
    const u = byUser[row.user_id];
    if (!u.provinces[row.province_code]) {
      u.provinces[row.province_code] = {};
    }
    u.provinces[row.province_code][row.party_code] = Number(row.seats) || 0;
    u.votedProvinces.add(row.province_code);
    if (row.updated_at > u.latestUpdatedAt) {
      u.latestUpdatedAt = row.updated_at;
    }
  }

  const entries: RankingEntry[] = Object.entries(byUser).map(([userId, data]) => {
    let totalDeviation = 0;

    for (const prov of PROVINCES) {
      const userProv = data.provinces[prov.code] || {};
      const realProv = liveResults.provincialSeats[prov.code] || {};

      for (const partyCode of prov.parties) {
        const userSeats = userProv[partyCode] ?? 0;
        const realSeats = realProv[partyCode] ?? 0;
        totalDeviation += Math.abs(userSeats - realSeats);
      }
    }

    const profile = profilesMap[userId];
    return {
      userId,
      fullName: profile?.full_name || `Usuario ${userId.slice(0, 6)}`,
      avatarUrl: profile?.avatar_url || null,
      deviation: totalDeviation,
      updatedAt: data.latestUpdatedAt,
      completedCount: data.votedProvinces.size,
      totalCount: PROVINCES.length,
    };
  });

  return entries.sort(compareRankingEntries);
}

/**
 * Ránking Sección 2: Porra Estatal por Escaños (Congreso)
 * SUM(|escaños_usuario - escaños_reales|) sobre los 16 partidos del Congreso.
 */
export function calculateNationalSeatsRanking(
  rows: NationalSeatPredictionRow[],
  profilesMap: Record<string, UserProfile>,
  liveResults: LiveResultsData
): RankingEntry[] {
  const byUser: Record<
    string,
    {
      seats: Record<string, number>;
      latestUpdatedAt: string;
    }
  > = {};

  for (const row of rows) {
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = {
        seats: {},
        latestUpdatedAt: row.updated_at,
      };
    }
    byUser[row.user_id].seats[row.party_code] = Number(row.seats) || 0;
    if (row.updated_at > byUser[row.user_id].latestUpdatedAt) {
      byUser[row.user_id].latestUpdatedAt = row.updated_at;
    }
  }

  const entries: RankingEntry[] = Object.entries(byUser).map(([userId, data]) => {
    let totalDeviation = 0;
    for (const party of CONGRESS_PARTIES) {
      const userSeats = data.seats[party.code] ?? 0;
      const realSeats = liveResults.nationalSeats[party.code] ?? 0;
      totalDeviation += Math.abs(userSeats - realSeats);
    }

    const profile = profilesMap[userId];
    return {
      userId,
      fullName: profile?.full_name || `Usuario ${userId.slice(0, 6)}`,
      avatarUrl: profile?.avatar_url || null,
      deviation: totalDeviation,
      updatedAt: data.latestUpdatedAt,
      completedCount: Object.keys(data.seats).length,
      totalCount: CONGRESS_PARTIES.length,
    };
  });

  return entries.sort(compareRankingEntries);
}

/**
 * Ránking Sección 3: Porra Estatal por Porcentaje (Congreso)
 * SUM(|porcentaje_usuario - porcentaje_real|) sobre los 16 partidos del Congreso.
 */
export function calculateNationalPctRanking(
  rows: NationalPctPredictionRow[],
  profilesMap: Record<string, UserProfile>,
  liveResults: LiveResultsData
): RankingEntry[] {
  const byUser: Record<
    string,
    {
      pcts: Record<string, number>;
      latestUpdatedAt: string;
    }
  > = {};

  for (const row of rows) {
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = {
        pcts: {},
        latestUpdatedAt: row.updated_at,
      };
    }
    byUser[row.user_id].pcts[row.party_code] = Number(row.percentage) || 0;
    if (row.updated_at > byUser[row.user_id].latestUpdatedAt) {
      byUser[row.user_id].latestUpdatedAt = row.updated_at;
    }
  }

  const entries: RankingEntry[] = Object.entries(byUser).map(([userId, data]) => {
    let totalDeviation = 0;
    for (const party of CONGRESS_PARTIES) {
      const userPct = data.pcts[party.code] ?? 0;
      const realPct = liveResults.nationalPct[party.code] ?? 0;
      totalDeviation += Math.abs(userPct - realPct);
    }

    const profile = profilesMap[userId];
    return {
      userId,
      fullName: profile?.full_name || `Usuario ${userId.slice(0, 6)}`,
      avatarUrl: profile?.avatar_url || null,
      deviation: Number(totalDeviation.toFixed(2)),
      updatedAt: data.latestUpdatedAt,
      completedCount: Object.keys(data.pcts).length,
      totalCount: CONGRESS_PARTIES.length,
    };
  });

  return entries.sort(compareRankingEntries);
}

/**
 * Ránking Sección 4: Porra del Senado (Estatal por Escaños)
 * SUM(|escaños_usuario - escaños_reales|) sobre los 7 partidos del Senado.
 */
export function calculateSenateRanking(
  rows: SenatePredictionRow[],
  profilesMap: Record<string, UserProfile>,
  liveResults: LiveResultsData
): RankingEntry[] {
  const byUser: Record<
    string,
    {
      seats: Record<string, number>;
      latestUpdatedAt: string;
    }
  > = {};

  for (const row of rows) {
    if (!byUser[row.user_id]) {
      byUser[row.user_id] = {
        seats: {},
        latestUpdatedAt: row.updated_at,
      };
    }
    byUser[row.user_id].seats[row.party_code] = Number(row.seats) || 0;
    if (row.updated_at > byUser[row.user_id].latestUpdatedAt) {
      byUser[row.user_id].latestUpdatedAt = row.updated_at;
    }
  }

  const entries: RankingEntry[] = Object.entries(byUser).map(([userId, data]) => {
    let totalDeviation = 0;
    for (const party of SENATE_PARTIES) {
      const userSeats = data.seats[party.code] ?? 0;
      const realSeats = liveResults.senateSeats[party.code] ?? 0;
      totalDeviation += Math.abs(userSeats - realSeats);
    }

    const profile = profilesMap[userId];
    return {
      userId,
      fullName: profile?.full_name || `Usuario ${userId.slice(0, 6)}`,
      avatarUrl: profile?.avatar_url || null,
      deviation: totalDeviation,
      updatedAt: data.latestUpdatedAt,
      completedCount: Object.keys(data.seats).length,
      totalCount: SENATE_PARTIES.length,
    };
  });

  return entries.sort(compareRankingEntries);
}
