import { DHONDT_MIN_THRESHOLD_PCT } from '../constants/elections';

export interface DHondtLastSeatInfo {
  partyCode: string;
  quotient: number;
  pct: number;
  seatsWon: number;
}

export interface DHondtNextSeatInfo {
  partyCode: string;
  currentPct: number;
  targetPct: number;
  pctDiff: number;
  nextQuotient: number;
  seatsWon: number;
}

export interface DHondtResult {
  seatsByParty: Record<string, number>;
  totalAllocated: number;
  lastSeatWinner: DHondtLastSeatInfo | null;
  nextSeatContender: DHondtNextSeatInfo | null;
  eligibleParties: string[];
}

/**
 * Calcula el reparto de escaños por el método D'Hondt con barrera electoral mínima del 3%.
 * Destaca además qué partido obtuvo el último escaño de la circunscripción
 * y qué partido se llevaría el siguiente escaño junto a la diferencia porcentual necesaria.
 */
export function calculateDHondt(
  provinceSeats: number,
  percentages: Record<string, number>,
  partyOrder: string[]
): DHondtResult {
  const seatsByParty: Record<string, number> = {};
  for (const party of partyOrder) {
    seatsByParty[party] = 0;
  }

  // Filtrar partidos que alcanzan o superan el mínimo del 3%
  const eligibleParties = partyOrder.filter(
    (party) => (percentages[party] ?? 0) >= DHONDT_MIN_THRESHOLD_PCT
  );

  if (provinceSeats <= 0 || eligibleParties.length === 0) {
    // Si ningún partido llega al 3%, calcular quién está más cerca de llegar al 3%
    let closestParty: string | null = null;
    let bestPct = -1;
    for (const party of partyOrder) {
      const pct = percentages[party] ?? 0;
      if (pct > bestPct) {
        bestPct = pct;
        closestParty = party;
      }
    }

    const nextSeatContender: DHondtNextSeatInfo | null = closestParty
      ? {
          partyCode: closestParty,
          currentPct: bestPct,
          targetPct: DHONDT_MIN_THRESHOLD_PCT,
          pctDiff: Math.max(0.01, Number((DHONDT_MIN_THRESHOLD_PCT - bestPct).toFixed(2))),
          nextQuotient: bestPct,
          seatsWon: 0,
        }
      : null;

    return {
      seatsByParty,
      totalAllocated: 0,
      lastSeatWinner: null,
      nextSeatContender,
      eligibleParties: [],
    };
  }

  interface QuotientEntry {
    partyCode: string;
    divisor: number;
    quotient: number;
    pct: number;
    orderIndex: number;
  }

  const allQuotients: QuotientEntry[] = [];
  eligibleParties.forEach((partyCode) => {
    const pct = percentages[partyCode] ?? 0;
    const orderIndex = partyOrder.indexOf(partyCode);
    for (let divisor = 1; divisor <= provinceSeats; divisor++) {
      allQuotients.push({
        partyCode,
        divisor,
        quotient: pct / divisor,
        pct,
        orderIndex,
      });
    }
  });

  // Ordenar cocientes de mayor a menor; en caso de empate, gana el partido con más % de voto,
  // y si persiste el empate, el orden canónico de la lista.
  allQuotients.sort((a, b) => {
    if (Math.abs(b.quotient - a.quotient) > 1e-9) {
      return b.quotient - a.quotient;
    }
    if (Math.abs(b.pct - a.pct) > 1e-9) {
      return b.pct - a.pct;
    }
    return a.orderIndex - b.orderIndex;
  });

  const winningQuotients = allQuotients.slice(0, provinceSeats);
  for (const win of winningQuotients) {
    seatsByParty[win.partyCode] = (seatsByParty[win.partyCode] ?? 0) + 1;
  }

  const lastWinnerEntry = winningQuotients[winningQuotients.length - 1];
  const lastSeatWinner: DHondtLastSeatInfo = {
    partyCode: lastWinnerEntry.partyCode,
    quotient: lastWinnerEntry.quotient,
    pct: lastWinnerEntry.pct,
    seatsWon: seatsByParty[lastWinnerEntry.partyCode],
  };

  // Calcular qué otro partido se llevaría el siguiente escaño (o arrebataría el último escaño)
  // Para cada partido distinto del ganador del último escaño, necesita:
  // 1) Superar el umbral del 3.0%
  // 2) Que su cociente para (escaños_actuales + 1) supere el cociente del último escaño (lastWinnerEntry.quotient)
  const candidateParties = partyOrder.filter((p) => p !== lastWinnerEntry.partyCode);

  let bestContender: DHondtNextSeatInfo | null = null;

  for (const partyCode of candidateParties) {
    const currentPct = percentages[partyCode] ?? 0;
    const currentSeats = seatsByParty[partyCode] ?? 0;
    const nextDivisor = currentSeats + 1;
    const nextQuotient = currentPct >= DHONDT_MIN_THRESHOLD_PCT ? currentPct / nextDivisor : 0;

    // Porcentaje necesario para igualar/superar el último cociente ganador (y al menos 3%)
    const rawTargetPct = Math.max(
      DHONDT_MIN_THRESHOLD_PCT,
      lastWinnerEntry.quotient * nextDivisor
    );
    const rawDiff = Math.max(0.01, rawTargetPct - currentPct);

    const candidateInfo: DHondtNextSeatInfo = {
      partyCode,
      currentPct,
      targetPct: Number(rawTargetPct.toFixed(2)),
      pctDiff: Number(rawDiff.toFixed(2)),
      nextQuotient,
      seatsWon: currentSeats,
    };

    if (!bestContender) {
      bestContender = candidateInfo;
    } else {
      // Priorizamos al partido con menor diferencia porcentual necesaria para arrebatar el escaño
      // (y a igualdad de diferencia, el que tenga mayor siguiente cociente / mayor porcentaje actual)
      if (candidateInfo.pctDiff < bestContender.pctDiff - 1e-6) {
        bestContender = candidateInfo;
      } else if (
        Math.abs(candidateInfo.pctDiff - bestContender.pctDiff) <= 1e-6 &&
        candidateInfo.currentPct > bestContender.currentPct
      ) {
        bestContender = candidateInfo;
      }
    }
  }

  return {
    seatsByParty,
    totalAllocated: provinceSeats,
    lastSeatWinner,
    nextSeatContender: bestContender,
    eligibleParties,
  };
}
