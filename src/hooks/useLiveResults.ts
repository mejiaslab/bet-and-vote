import { useCallback, useEffect, useState } from 'react';
import {
  CONGRESS_PARTIES,
  PROVINCES,
  SENATE_PARTIES,
} from '../constants/elections';
import { calculateDHondt } from '../utils/dhondt';
import { LiveResultsData } from '../utils/rankings';

export const LIVE_RESULTS_URL = 'https://datos.generales29n.com';
const POLL_INTERVAL_MS = 30000;

function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function matchCongressParty(rawKey: string): string | null {
  const norm = normalizeKey(rawKey);
  for (const p of CONGRESS_PARTIES) {
    if (normalizeKey(p.code) === norm || normalizeKey(p.shortName) === norm) {
      return p.code;
    }
    if (p.aliases.some((a) => normalizeKey(a) === norm)) {
      return p.code;
    }
  }
  return null;
}

function matchSenateParty(rawKey: string): string | null {
  const norm = normalizeKey(rawKey);
  for (const p of SENATE_PARTIES) {
    if (normalizeKey(p.code) === norm || normalizeKey(p.shortName) === norm) {
      return p.code;
    }
    if (p.aliases.some((a) => normalizeKey(a) === norm)) {
      return p.code;
    }
  }
  return null;
}

function matchProvinceCode(rawProv: string): string | null {
  const clean = rawProv.trim();
  const padded = clean.padStart(2, '0');
  const byCode = PROVINCES.find((p) => p.code === clean || p.code === padded);
  if (byCode) return byCode.code;

  const norm = normalizeKey(clean);
  const byName = PROVINCES.find((p) => normalizeKey(p.name) === norm);
  return byName ? byName.code : null;
}

export function createEmptyLiveResults(sourceLabel = 'En espera del escrutinio oficial'): LiveResultsData {
  const provincialSeats: Record<string, Record<string, number>> = {};
  for (const prov of PROVINCES) {
    provincialSeats[prov.code] = {};
    for (const party of prov.parties) {
      provincialSeats[prov.code][party] = 0;
    }
  }

  const nationalSeats: Record<string, number> = {};
  const nationalPct: Record<string, number> = {};
  for (const party of CONGRESS_PARTIES) {
    nationalSeats[party.code] = 0;
    nationalPct[party.code] = 0;
  }

  const senateSeats: Record<string, number> = {};
  for (const party of SENATE_PARTIES) {
    senateSeats[party.code] = 0;
  }

  return {
    isAvailable: false,
    scrutinyPct: 0,
    updatedAt: null,
    sourceLabel,
    provincialSeats,
    nationalSeats,
    nationalPct,
    senateSeats,
  };
}

/**
 * Genera datos de escrutinio simulados realistas (útil para previsualizar el funcionamiento
 * de los ránkings antes de que comience el escrutinio oficial en datos.generales29n.com).
 */
export function createSimulatedLiveResults(): LiveResultsData {
  const base = createEmptyLiveResults('Simulación de escrutinio (Vista previa)');
  base.isAvailable = true;
  base.scrutinyPct = 100;
  base.updatedAt = new Date().toISOString();

  const baseNationalPct: Record<string, number> = {
    PP: 33.4,
    PSOE: 30.8,
    VOX: 12.1,
    'Frente Amplio': 10.6,
    Podemos: 2.1,
    ERC: 1.9,
    Junts: 1.7,
    BNG: 0.8,
    PNV: 1.2,
    'EH Bildu': 1.4,
    'Adelante Andalucía': 0.7,
    'Compromìs': 0.9,
    'Coalición Canaria': 0.5,
    UPC: 0.2,
    SALF: 1.1,
    'Ara Mès': 0.3,
  };

  base.nationalPct = baseNationalPct;

  const accumulatedSeats: Record<string, number> = {};
  for (const p of CONGRESS_PARTIES) accumulatedSeats[p.code] = 0;

  for (const prov of PROVINCES) {
    const provPcts: Record<string, number> = {};
    prov.parties.forEach((partyCode, idx) => {
      if (partyCode === 'PP') provPcts[partyCode] = 32 + ((Number(prov.code) * 3) % 9);
      else if (partyCode === 'PSOE') provPcts[partyCode] = 29 + ((Number(prov.code) * 5) % 8);
      else if (partyCode === 'VOX') provPcts[partyCode] = 11 + ((Number(prov.code) * 2) % 6);
      else if (partyCode === 'Frente Amplio') provPcts[partyCode] = 9 + ((Number(prov.code) * 4) % 6);
      else provPcts[partyCode] = 8 + ((idx * 4 + Number(prov.code)) % 10);
    });

    const dhondt = calculateDHondt(prov.seats, provPcts, prov.parties);
    base.provincialSeats[prov.code] = dhondt.seatsByParty;
    for (const [party, seats] of Object.entries(dhondt.seatsByParty)) {
      accumulatedSeats[party] = (accumulatedSeats[party] ?? 0) + seats;
    }
  }

  base.nationalSeats = accumulatedSeats;
  base.senateSeats = {
    PP: 118,
    'Senado de Progreso': 74,
    VOX: 4,
    ERC: 5,
    Junts: 3,
    PNV: 4,
    'EH Bildu': 4,
  };

  return base;
}

/**
 * Parsea de forma flexible cualquier estructura JSON devuelta por https://datos.generales29n.com
 */
export function parseOfficialPayload(payload: unknown): LiveResultsData | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;

  const result = createEmptyLiveResults('Escrutinio Oficial (datos.generales29n.com)');
  let foundAnyData = false;

  const scrutinyRaw =
    obj.scrutinyPct ??
    obj.escrutado ??
    obj.porcentaje_escrutado ??
    obj.scrutiny ??
    (typeof obj.meta === 'object' && obj.meta !== null
      ? (obj.meta as Record<string, unknown>).escrutado
      : undefined);

  if (typeof scrutinyRaw === 'number') {
    result.scrutinyPct = scrutinyRaw;
  }

  // 1. Provincias
  const rawProvinces =
    obj.provincial ??
    obj.provincias ??
    obj.provincialSeats ??
    obj.circunscripciones ??
    (typeof obj.congreso === 'object' && obj.congreso !== null
      ? (obj.congreso as Record<string, unknown>).provincias
      : undefined);

  if (rawProvinces && typeof rawProvinces === 'object') {
    for (const [provKey, provVal] of Object.entries(rawProvinces as Record<string, unknown>)) {
      const provCode = matchProvinceCode(provKey);
      if (!provCode || !provVal || typeof provVal !== 'object') continue;

      const provObj = provVal as Record<string, unknown>;
      const partiesSource =
        (provObj.partidos as Record<string, unknown>) ||
        (provObj.seats as Record<string, unknown>) ||
        (provObj.escanos as Record<string, unknown>) ||
        provObj;

      for (const [partyKey, seatVal] of Object.entries(partiesSource)) {
        const partyCode = matchCongressParty(partyKey);
        if (!partyCode) continue;
        const seats =
          typeof seatVal === 'number'
            ? seatVal
            : typeof seatVal === 'object' && seatVal !== null
            ? Number(
                (seatVal as Record<string, unknown>).seats ??
                  (seatVal as Record<string, unknown>).escanos ??
                  0
              )
            : Number(seatVal);

        if (!Number.isNaN(seats)) {
          result.provincialSeats[provCode][partyCode] = seats;
          if (seats > 0) foundAnyData = true;
        }
      }
    }
  }

  // 2. Nacional Congreso (Escaños y Porcentajes)
  const rawNational =
    obj.national ??
    obj.nacional ??
    obj.congreso ??
    obj.totales ??
    obj;

  if (rawNational && typeof rawNational === 'object') {
    const natObj = rawNational as Record<string, unknown>;
    const seatsMap =
      (natObj.nationalSeats as Record<string, unknown>) ||
      (natObj.seats as Record<string, unknown>) ||
      (natObj.escanos as Record<string, unknown>) ||
      (natObj.partidos as Record<string, unknown>);

    if (seatsMap && typeof seatsMap === 'object') {
      for (const [partyKey, val] of Object.entries(seatsMap)) {
        const partyCode = matchCongressParty(partyKey);
        if (!partyCode) continue;
        if (typeof val === 'number') {
          result.nationalSeats[partyCode] = val;
          if (val > 0) foundAnyData = true;
        } else if (typeof val === 'object' && val !== null) {
          const vObj = val as Record<string, unknown>;
          const s = Number(vObj.seats ?? vObj.escanos ?? 0);
          const pct = Number(vObj.percentage ?? vObj.porcentaje ?? vObj.pct ?? 0);
          if (!Number.isNaN(s)) {
            result.nationalSeats[partyCode] = s;
            if (s > 0) foundAnyData = true;
          }
          if (!Number.isNaN(pct)) {
            result.nationalPct[partyCode] = pct;
            if (pct > 0) foundAnyData = true;
          }
        }
      }
    }

    const pctMap =
      (natObj.nationalPct as Record<string, unknown>) ||
      (natObj.percentages as Record<string, unknown>) ||
      (natObj.porcentajes as Record<string, unknown>);

    if (pctMap && typeof pctMap === 'object') {
      for (const [partyKey, val] of Object.entries(pctMap)) {
        const partyCode = matchCongressParty(partyKey);
        if (!partyCode) continue;
        const pct = Number(val);
        if (!Number.isNaN(pct)) {
          result.nationalPct[partyCode] = pct;
          if (pct > 0) foundAnyData = true;
        }
      }
    }
  }

  // Si hay escaños provinciales pero no nacionales explícitos, acumularlos
  const totalNatSeats = Object.values(result.nationalSeats).reduce((a, b) => a + b, 0);
  if (totalNatSeats === 0 && foundAnyData) {
    for (const prov of PROVINCES) {
      for (const [partyCode, seats] of Object.entries(result.provincialSeats[prov.code] || {})) {
        result.nationalSeats[partyCode] = (result.nationalSeats[partyCode] ?? 0) + seats;
      }
    }
  }

  // 3. Senado
  const rawSenate =
    obj.senate ??
    obj.senado ??
    obj.senateSeats;

  if (rawSenate && typeof rawSenate === 'object') {
    const senObj = rawSenate as Record<string, unknown>;
    const senMap =
      (senObj.partidos as Record<string, unknown>) ||
      (senObj.seats as Record<string, unknown>) ||
      (senObj.escanos as Record<string, unknown>) ||
      senObj;

    for (const [partyKey, val] of Object.entries(senMap)) {
      const partyCode = matchSenateParty(partyKey);
      if (!partyCode) continue;
      const seats =
        typeof val === 'number'
          ? val
          : typeof val === 'object' && val !== null
          ? Number(
              (val as Record<string, unknown>).seats ??
                (val as Record<string, unknown>).escanos ??
                0
            )
          : Number(val);
      if (!Number.isNaN(seats)) {
        result.senateSeats[partyCode] = seats;
        if (seats > 0) foundAnyData = true;
      }
    }
  }

  if (!foundAnyData) return null;

  result.isAvailable = true;
  result.updatedAt = new Date().toISOString();
  if (result.scrutinyPct <= 0) {
    result.scrutinyPct = 100;
  }
  return result;
}

export interface UseLiveResultsReturn {
  results: LiveResultsData;
  isLoading: boolean;
  isWaitingForScrutiny: boolean;
  lastCheckedAt: string | null;
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  refreshNow: () => Promise<void>;
}

/**
 * Hook que obtiene en tiempo real los resultados oficiales desde https://datos.generales29n.com
 * con polling periódico y estado de espera si el escrutinio aún no ha comenzado.
 */
export function useLiveResults(): UseLiveResultsReturn {
  const [officialResults, setOfficialResults] = useState<LiveResultsData>(() =>
    createEmptyLiveResults()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWaitingForScrutiny, setIsWaitingForScrutiny] = useState<boolean>(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  const fetchOfficialResults = useCallback(async () => {
    setIsLoading(true);
    const candidateEndpoints = [
      LIVE_RESULTS_URL,
      `${LIVE_RESULTS_URL}/datos.json`,
      `${LIVE_RESULTS_URL}/results.json`,
      `${LIVE_RESULTS_URL}/api/results`,
    ];

    let parsed: LiveResultsData | null = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 6000);

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { Accept: 'application/json, text/plain, */*' },
          signal: controller.signal,
        });
        window.clearTimeout(timeoutId);

        if (!response.ok) continue;

        const text = await response.text();
        let jsonData: unknown = null;

        try {
          jsonData = JSON.parse(text);
        } catch {
          // Si devuelve HTML con un bloque JSON embebido, intentar extraerlo
          const scriptMatch = text.match(
            /<script[^>]*id=["'](?:__NEXT_DATA__|__INITIAL_DATA__|datos-29n)["'][^>]*>([\s\S]*?)<\/script>/i
          );
          if (scriptMatch?.[1]) {
            jsonData = JSON.parse(scriptMatch[1]);
          }
        }

        if (jsonData) {
          parsed = parseOfficialPayload(jsonData);
          if (parsed && parsed.isAvailable) {
            break;
          }
        }
      } catch {
        // Endpoint aún en espera o bloqueado por CORS antes del inicio del escrutinio
      }
    }

    setLastCheckedAt(new Date().toISOString());

    if (parsed && parsed.isAvailable) {
      setOfficialResults(parsed);
      setIsWaitingForScrutiny(false);
    } else {
      setOfficialResults(createEmptyLiveResults());
      setIsWaitingForScrutiny(true);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOfficialResults();
    const interval = window.setInterval(fetchOfficialResults, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchOfficialResults]);

  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode((prev) => !prev);
  }, []);

  const activeResults = isSimulationMode
    ? createSimulatedLiveResults()
    : officialResults;

  return {
    results: activeResults,
    isLoading,
    isWaitingForScrutiny: isSimulationMode ? false : isWaitingForScrutiny,
    lastCheckedAt,
    isSimulationMode,
    toggleSimulationMode,
    refreshNow: fetchOfficialResults,
  };
}
