import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CONGRESS_PARTIES,
  PROVINCES,
  SENATE_PARTIES,
} from '../constants/elections';
import { calculateDHondt } from '../utils/dhondt';
import { LiveResultsData } from '../utils/rankings';

export const LIVE_RESULTS_URL = 'https://datos.generales29n.com';
export const CONGRESO_BASE_URL = `${LIVE_RESULTS_URL}/v1/congreso-2026-11`;
export const SENADO_BASE_URL = `${LIVE_RESULTS_URL}/v1/senado-2026-11`;
export const HIST_2023_CONGRESO_URL = `${LIVE_RESULTS_URL}/v1/hist/congreso-2023-07`;

const POLL_INTERVAL_MS = 30000;

/**
 * Esquema oficial documentado en datos.generales29n.com/v1/{eleccion}/manifest.json
 */
export interface Generales29NManifest {
  version: number;
  election: string;
  seq: number;
  generated_at: string;
  phase: 'pre' | 'live' | 'final' | string;
  counted_pct: number;
  stale: boolean;
  embargo: boolean;
  base: string;
  root: string;
  mun_index?: string;
  winners_index?: string;
  source?: string;
  source_url?: string | null;
  official?: boolean;
}

/**
 * Esquema oficial de cada candidatura en `results[]` dentro de `{seq}/es.json` y `{seq}/prov/{code}.json`
 */
export interface Generales29NCandidacyResult {
  candidacy?: string;
  acronym?: string | null;
  short_name?: string | null;
  name?: string | null;
  family?: string | null;
  color?: string | null;
  votes?: number;
  pct?: number;
  seats?: number;
  seats_source?: string;
}

/**
 * Esquema oficial de archivo territorial (`es.json` o `prov/{01..52}.json`)
 */
export interface Generales29NScopeFile {
  scope?: {
    type: 'es' | 'ccaa' | 'prov' | 'mun' | string;
    code: string;
    name: string;
  };
  seq?: number;
  updated_at?: string;
  counted?: {
    tables: number;
    total_tables: number;
    pct: number;
  };
  totals?: {
    valid: number;
    blank: number;
    null: number;
  };
  results?: Generales29NCandidacyResult[];
}

function normalizeText(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Clasifica una fila de `results[]` de datos.generales29n.com en uno de los 16 partidos del Congreso,
 * respetando las coaliciones territoriales proclamadas en el BOE para el 29N-2026:
 * - Canarias: "NC-BC, PODEMOS, IU, SUMAR" / "UNIDAD DEL PUEBLO CANARIO UPC" -> 'UPC'
 * - Baleares: "ARAMÉS-EU-MS" / "ARAMÉS-FRONT AMPLI" -> 'Ara Mès'
 * - C. Valenciana: "COMPROMÍS-EUPV-PODEM-ERPV" / "COMPROMÍS: FRONT VALENCIÀ" -> 'Compromìs'
 * - Navarra: "UPN-PP" -> 'PP'
 */
export function matchCongressCandidacyToPartyCode(
  row: Generales29NCandidacyResult
): string | null {
  const combined = normalizeText(
    `${row.acronym || ''} | ${row.short_name || ''} | ${row.name || ''} | ${row.family || ''}`
  );

  // 1. Partidos regionales/coaliciones específicas primero (para evitar falsos positivos con PODEMOS/FA)
  if (/\bUPC\b|UNIDAD DEL PUEBLO CANARIO|NUEVA CANARIAS|\bNC-BC\b/.test(combined)) {
    return 'UPC';
  }
  if (/ARAMES|ARA MES|\bMES\b/.test(combined)) {
    return 'Ara Mès';
  }
  if (/COMPROMIS/.test(combined)) {
    return 'Compromìs';
  }
  if (/ADELANTE ANDALUCIA|\bADELANTE\b/.test(combined)) {
    return 'Adelante Andalucía';
  }
  if (/COALICION CANARIA|\bCCA\b|1\.ºCAN/.test(combined)) {
    return 'Coalición Canaria';
  }
  if (/\bBNG\b|B\.N\.G|BLOQUE NACIONALISTA GALEGO/.test(combined)) {
    return 'BNG';
  }
  if (/EAJ-PNV|EUZKO ALDERDI|\bPNV\b/.test(combined)) {
    return 'PNV';
  }
  if (/BILDU|EH-BILDU|EUSKAL HERRIA BILDU/.test(combined)) {
    return 'EH Bildu';
  }
  if (/\bERC\b|ESQUERRA REPUBLICANA/.test(combined)) {
    return 'ERC';
  }
  if (/JUNTS|JXCAT/.test(combined)) {
    return 'Junts';
  }
  if (/\bSALF\b|SE ACABO LA FIESTA/.test(combined)) {
    return 'SALF';
  }

  // 2. Partidos de ámbito estatal
  if (/\bVOX\b/.test(combined)) {
    return 'VOX';
  }
  if (/PARTIDO POPULAR|PARTIT POPULAR|\bPP\b|UPN-PP/.test(combined)) {
    return 'PP';
  }
  if (/\bPSOE\b|\bPSC\b|PSDEG|PSE-EE|PSIB|\bPSN\b|PARTIDO SOCIALISTA|PARTIT DELS SOCIALISTES/.test(combined)) {
    return 'PSOE';
  }
  if (
    /FRENTE AMPLIO|FRONT AMPLI|FRONTE AMPLA|FRONTE ZABALA|FRENTE AMPLIU|\bFA\b|\bSUMAR\b|COMUNS/.test(
      combined
    )
  ) {
    return 'Frente Amplio';
  }
  if (/\bPODEMOS\b/.test(combined)) {
    return 'Podemos';
  }

  return null;
}

/**
 * Clasifica una fila de `results[]` del Senado en uno de los 7 partidos de la Porra del Senado.
 */
export function matchSenateCandidacyToPartyCode(
  row: Generales29NCandidacyResult
): string | null {
  const combined = normalizeText(
    `${row.acronym || ''} | ${row.short_name || ''} | ${row.name || ''} | ${row.family || ''}`
  );

  if (/SENADO DE PROGRESO|\bSDP\b|\bPSOE\b|\bPSC\b|PSDEG|PSE-EE|PSIB|\bPSN\b|PROGRESO/.test(combined)) {
    return 'Senado de Progreso';
  }
  if (/PARTIDO POPULAR|PARTIT POPULAR|\bPP\b|UPN-PP/.test(combined)) {
    return 'PP';
  }
  if (/\bVOX\b/.test(combined)) {
    return 'VOX';
  }
  if (/\bERC\b|ESQUERRA REPUBLICANA|IZQUIERDAS POR LA INDEPENDENCIA/.test(combined)) {
    return 'ERC';
  }
  if (/JUNTS|JXCAT/.test(combined)) {
    return 'Junts';
  }
  if (/EAJ-PNV|EUZKO ALDERDI|\bPNV\b/.test(combined)) {
    return 'PNV';
  }
  if (/BILDU|EH-BILDU|EUSKAL HERRIA BILDU/.test(combined)) {
    return 'EH Bildu';
  }

  return null;
}

export function isManifestReady(manifest: Generales29NManifest): boolean {
  return (
    manifest.phase !== 'pre' &&
    manifest.embargo !== true &&
    Number(manifest.counted_pct || 0) > 0
  );
}

export function createEmptyLiveResults(
  sourceLabel = 'En espera del escrutinio oficial (29N 21:00h CET)'
): LiveResultsData {
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
 * Parsea un archivo `es.json` del Congreso en el objeto `LiveResultsData`.
 */
export function parseNationalCongressScopeFile(
  scopeData: Generales29NScopeFile,
  target: LiveResultsData
): void {
  if (scopeData.counted && typeof scopeData.counted.pct === 'number') {
    target.scrutinyPct = scopeData.counted.pct;
  }
  if (scopeData.updated_at) {
    target.updatedAt = scopeData.updated_at;
  }

  const validVotes = scopeData.totals?.valid || 0;
  const rows = Array.isArray(scopeData.results) ? scopeData.results : [];

  // Reiniciar acumuladores nacionales antes de sumar (por si varias siglas autonómicas mapean al mismo partido)
  const seatsAcc: Record<string, number> = {};
  const pctAcc: Record<string, number> = {};
  const votesAcc: Record<string, number> = {};

  for (const p of CONGRESS_PARTIES) {
    seatsAcc[p.code] = 0;
    pctAcc[p.code] = 0;
    votesAcc[p.code] = 0;
  }

  for (const row of rows) {
    const partyCode = matchCongressCandidacyToPartyCode(row);
    if (!partyCode) continue;

    seatsAcc[partyCode] = (seatsAcc[partyCode] ?? 0) + (Number(row.seats) || 0);
    pctAcc[partyCode] = Number(((pctAcc[partyCode] ?? 0) + (Number(row.pct) || 0)).toFixed(2));
    votesAcc[partyCode] = (votesAcc[partyCode] ?? 0) + (Number(row.votes) || 0);
  }

  // Si hay votos válidos totales, calcular porcentaje exacto sobre voto válido cuando pct no venga informado
  for (const p of CONGRESS_PARTIES) {
    target.nationalSeats[p.code] = seatsAcc[p.code];
    if (pctAcc[p.code] > 0) {
      target.nationalPct[p.code] = pctAcc[p.code];
    } else if (validVotes > 0 && votesAcc[p.code] > 0) {
      target.nationalPct[p.code] = Number(((votesAcc[p.code] / validVotes) * 100).toFixed(2));
    }
  }
}

/**
 * Parsea un archivo provincial `prov/{01..52}.json` del Congreso.
 * Si el archivo ya trae `seats` calculados en `results[]`, los usa directamente;
 * si durante los primeros minutos solo trae `votes`/`pct`, aplica D'Hondt con barrera del 3%.
 */
export function parseProvinceCongressScopeFile(
  provinceCode: string,
  scopeData: Generales29NScopeFile,
  target: LiveResultsData
): void {
  const provConfig = PROVINCES.find((p) => p.code === provinceCode);
  if (!provConfig) return;

  const rows = Array.isArray(scopeData.results) ? scopeData.results : [];
  const seatsMap: Record<string, number> = {};
  const pctMap: Record<string, number> = {};
  const validVotes = scopeData.totals?.valid || 0;

  for (const partyCode of provConfig.parties) {
    seatsMap[partyCode] = 0;
    pctMap[partyCode] = 0;
  }

  let totalExplicitSeats = 0;

  for (const row of rows) {
    const partyCode = matchCongressCandidacyToPartyCode(row);
    if (!partyCode || !provConfig.parties.includes(partyCode)) continue;

    const rowSeats = Number(row.seats) || 0;
    seatsMap[partyCode] = (seatsMap[partyCode] ?? 0) + rowSeats;
    totalExplicitSeats += rowSeats;

    const rowPct =
      typeof row.pct === 'number' && row.pct > 0
        ? row.pct
        : validVotes > 0 && typeof row.votes === 'number'
        ? (row.votes / validVotes) * 100
        : 0;
    pctMap[partyCode] = Number(((pctMap[partyCode] ?? 0) + rowPct).toFixed(2));
  }

  if (totalExplicitSeats > 0) {
    target.provincialSeats[provinceCode] = seatsMap;
  } else if (Object.values(pctMap).some((v) => v > 0)) {
    const dhondt = calculateDHondt(provConfig.seats, pctMap, provConfig.parties);
    target.provincialSeats[provinceCode] = dhondt.seatsByParty;
  }
}

/**
 * Parsea un archivo `es.json` del Senado en `target.senateSeats`.
 */
export function parseSenateScopeFile(
  scopeData: Generales29NScopeFile,
  target: LiveResultsData
): void {
  const rows = Array.isArray(scopeData.results) ? scopeData.results : [];
  const seatsAcc: Record<string, number> = {};
  for (const p of SENATE_PARTIES) seatsAcc[p.code] = 0;

  for (const row of rows) {
    const partyCode = matchSenateCandidacyToPartyCode(row);
    if (!partyCode) continue;
    seatsAcc[partyCode] = (seatsAcc[partyCode] ?? 0) + (Number(row.seats) || 0);
  }

  target.senateSeats = seatsAcc;
}

/**
 * Genera datos de escrutinio simulados realistas (útil para probar los ránkings antes del 29N a las 21:00h).
 */
export function createSimulatedLiveResults(): LiveResultsData {
  const base = createEmptyLiveResults('Simulación de escrutinio (Vista previa)');
  base.isAvailable = true;
  base.scrutinyPct = 100;
  base.updatedAt = new Date().toISOString();

  base.nationalPct = {
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

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export interface UseLiveResultsReturn {
  results: LiveResultsData;
  isLoading: boolean;
  isWaitingForScrutiny: boolean;
  lastCheckedAt: string | null;
  manifestInfo: Generales29NManifest | null;
  isSimulationMode: boolean;
  toggleSimulationMode: () => void;
  refreshNow: () => Promise<void>;
}

/**
 * Hook que consulta la API v1 oficial de https://datos.generales29n.com:
 * 1. Consulta `https://datos.generales29n.com/v1/congreso-2026-11/manifest.json`
 * 2. Si `phase !== "pre"`, `embargo === false` y `counted_pct > 0`, descarga:
 *    - `${base}/es.json` (totales nacionales del Congreso: escaños y % sobre voto válido)
 *    - `${base}/prov/{01..52}.json` (escaños de las 52 circunscripciones)
 * 3. Consulta además `https://datos.generales29n.com/v1/senado-2026-11/manifest.json` -> `${base}/es.json`
 *    para el recuento del Senado.
 * 4. Cachea el último `seq` descargado para no volver a pedir los 52 archivos provinciales si `seq` no ha cambiado.
 */
export function useLiveResults(): UseLiveResultsReturn {
  const [officialResults, setOfficialResults] = useState<LiveResultsData>(() =>
    createEmptyLiveResults()
  );
  const [manifestInfo, setManifestInfo] = useState<Generales29NManifest | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isWaitingForScrutiny, setIsWaitingForScrutiny] = useState<boolean>(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  const lastFetchedSeqRef = useRef<number | null>(null);
  const cachedDataRef = useRef<LiveResultsData | null>(null);

  const fetchOfficialResults = useCallback(async () => {
    setIsLoading(true);

    // 1. Consultar el manifiesto del Congreso en datos.generales29n.com
    const manifest = await fetchJsonWithTimeout<Generales29NManifest>(
      `${CONGRESO_BASE_URL}/manifest.json`
    );

    setLastCheckedAt(new Date().toISOString());

    if (!manifest) {
      setIsWaitingForScrutiny(true);
      setIsLoading(false);
      return;
    }

    setManifestInfo(manifest);

    // Si el manifiesto indica que estamos en fase previa o con embargo (antes de las 21:00h del 29N)
    if (!isManifestReady(manifest)) {
      setOfficialResults(
        createEmptyLiveResults(
          `En espera del escrutinio (seq #${manifest.seq} · fase: ${manifest.phase})`
        )
      );
      setIsWaitingForScrutiny(true);
      setIsLoading(false);
      return;
    }

    // Si la secuencia (seq) es idéntica a la ya descargada, reutilizamos los datos en caché
    if (lastFetchedSeqRef.current === manifest.seq && cachedDataRef.current) {
      setOfficialResults(cachedDataRef.current);
      setIsWaitingForScrutiny(false);
      setIsLoading(false);
      return;
    }

    const seqBase = (manifest.base || `${CONGRESO_BASE_URL}/${manifest.seq}`).replace(
      /\/$/,
      ''
    );

    const nextResults = createEmptyLiveResults(
      `Ministerio del Interior · datos.generales29n.com (seq #${manifest.seq})`
    );
    nextResults.scrutinyPct = Number(manifest.counted_pct) || 0;
    nextResults.updatedAt = manifest.generated_at || new Date().toISOString();

    // 2. Descargar fichero nacional `${seqBase}/es.json`
    const esData = await fetchJsonWithTimeout<Generales29NScopeFile>(`${seqBase}/es.json`);
    if (esData) {
      parseNationalCongressScopeFile(esData, nextResults);
    }

    // 3. Descargar las 52 provincias en lotes paralelos de 13 para ser respetuosos con el servidor
    const provinceCodes = PROVINCES.map((p) => p.code);
    const batchSize = 13;
    for (let i = 0; i < provinceCodes.length; i += batchSize) {
      const batch = provinceCodes.slice(i, i + batchSize);
      const batchFiles = await Promise.all(
        batch.map((code) =>
          fetchJsonWithTimeout<Generales29NScopeFile>(`${seqBase}/prov/${code}.json`)
        )
      );
      batchFiles.forEach((provFile, idx) => {
        if (provFile) {
          parseProvinceCongressScopeFile(batch[idx], provFile, nextResults);
        }
      });
    }

    // Si el fichero nacional aún no tenía escaños agregados pero sí las provincias, sumarlos
    const sumNatSeats = Object.values(nextResults.nationalSeats).reduce((a, b) => a + b, 0);
    if (sumNatSeats === 0) {
      for (const prov of PROVINCES) {
        for (const [partyCode, s] of Object.entries(nextResults.provincialSeats[prov.code] || {})) {
          nextResults.nationalSeats[partyCode] =
            (nextResults.nationalSeats[partyCode] ?? 0) + s;
        }
      }
    }

    // 4. Consultar manifiesto y fichero nacional del Senado (`v1/senado-2026-11/manifest.json`)
    const senadoManifest = await fetchJsonWithTimeout<Generales29NManifest>(
      `${SENADO_BASE_URL}/manifest.json`
    );
    if (senadoManifest && isManifestReady(senadoManifest)) {
      const senadoSeqBase = (
        senadoManifest.base || `${SENADO_BASE_URL}/${senadoManifest.seq}`
      ).replace(/\/$/, '');
      const senadoEs = await fetchJsonWithTimeout<Generales29NScopeFile>(
        `${senadoSeqBase}/es.json`
      );
      if (senadoEs) {
        parseSenateScopeFile(senadoEs, nextResults);
      }
    }

    nextResults.isAvailable = true;
    lastFetchedSeqRef.current = manifest.seq;
    cachedDataRef.current = nextResults;

    setOfficialResults(nextResults);
    setIsWaitingForScrutiny(false);
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
    manifestInfo,
    isSimulationMode,
    toggleSimulationMode,
    refreshNow: fetchOfficialResults,
  };
}
