export interface PrevElectionResult {
  seats: number;
  pct?: number;
  note?: string;
}

export interface PartyConfig {
  code: string;
  name: string;
  shortName: string;
  color: string;
  aliases: string[];
  prev2023?: PrevElectionResult;
}

export interface ProvinceConfig {
  code: string;
  name: string;
  region: string;
  seats: number;
  parties: string[];
  partyLabels?: Record<string, string>;
}

// Fecha exacta de cierre de porras: Domingo 29 de noviembre de 2026 a las 09:00h (hora peninsular española)
export const BETTING_DEADLINE_ISO = '2026-11-29T09:00:00+01:00';
export const BETTING_DEADLINE_DATE = new Date(BETTING_DEADLINE_ISO);

export const TOTAL_CONGRESS_SEATS = 350;
export const CONGRESS_MAJORITY_SEATS = 176;
export const DHONDT_MIN_THRESHOLD_PCT = 3.0;

export function isBettingOpen(now: Date = new Date()): boolean {
  return now.getTime() < BETTING_DEADLINE_DATE.getTime();
}

// 16 Partidos del Congreso con sus colores corporativos, siglas y referencia del 23J (2023)
export const CONGRESS_PARTIES: PartyConfig[] = [
  {
    code: 'PP',
    name: 'PP',
    shortName: 'PP',
    color: '#1D84CE',
    aliases: ['PP', 'PARTIDO POPULAR'],
    prev2023: { seats: 137, pct: 33.06 },
  },
  {
    code: 'PSOE',
    name: 'PSOE',
    shortName: 'PSOE',
    color: '#E30613',
    aliases: ['PSOE', 'PSC', 'PSOE-A', 'PSDEG', 'PSE-EE'],
    prev2023: { seats: 121, pct: 31.68 },
  },
  {
    code: 'VOX',
    name: 'VOX',
    shortName: 'VOX',
    color: '#63BE21',
    aliases: ['VOX'],
    prev2023: { seats: 33, pct: 12.38 },
  },
  {
    code: 'Frente Amplio',
    name: 'Frente Amplio',
    shortName: 'FA',
    color: '#E51C55',
    aliases: ['FRENTE AMPLIO', 'FA', 'FRENTE_AMPLIO', 'SUMAR'],
    prev2023: { seats: 25, pct: 10.2, note: 'Sumar' },
  },
  {
    code: 'Podemos',
    name: 'Podemos',
    shortName: 'POD',
    color: '#6B2D8C',
    aliases: ['PODEMOS', 'POD', 'UP'],
  },
  {
    code: 'ERC',
    name: 'ERC',
    shortName: 'ERC',
    color: '#FFB232',
    aliases: ['ERC', 'ESQUERRA'],
    prev2023: { seats: 7, pct: 1.89 },
  },
  {
    code: 'Junts',
    name: 'Junts',
    shortName: 'JUNTS',
    color: '#00C3B2',
    aliases: ['JUNTS', 'JXCAT', 'JUNTS PER CATALUNYA'],
    prev2023: { seats: 7, pct: 1.6 },
  },
  {
    code: 'BNG',
    name: 'BNG',
    shortName: 'BNG',
    color: '#76B3E1',
    aliases: ['BNG', 'BLOQUE NACIONALISTA GALEGO'],
    prev2023: { seats: 1, pct: 0.62 },
  },
  {
    code: 'PNV',
    name: 'PNV',
    shortName: 'PNV',
    color: '#008037',
    aliases: ['PNV', 'EAJ-PNV', 'EAJPNV'],
    prev2023: { seats: 5, pct: 1.12 },
  },
  {
    code: 'EH Bildu',
    name: 'EH Bildu',
    shortName: 'BILDU',
    color: '#B5CF18',
    aliases: ['EH BILDU', 'EHBILDU', 'BILDU'],
    prev2023: { seats: 6, pct: 1.36 },
  },
  {
    code: 'Adelante Andalucía',
    name: 'Adelante Andalucía',
    shortName: 'AA',
    color: '#00965E',
    aliases: ['ADELANTE ANDALUCIA', 'ADELANTE ANDALUCÍA', 'AA', 'ADELANTE_ANDALUCIA'],
    prev2023: { seats: 0, pct: 0.04 },
  },
  {
    code: 'Compromìs',
    name: 'COMPROMÍS: FRONT VALENCIÀ (COMPROMIS-EUPV-PODEM-ERPV)',
    shortName: 'COMP',
    color: '#F37021',
    aliases: ['COMPROMIS', 'COMPROMÌS', 'COMPROMÍS', 'COMP', 'FRONT VALENCIA', 'COMPROMIS-EUPV-PODEM-ERPV'],
    prev2023: { seats: 4, pct: 1.36, note: 'Compromís-Sumar' },
  },
  {
    code: 'Coalición Canaria',
    name: 'COALICIÓN CANARIA (CCa-1.ºCAN)',
    shortName: 'CC',
    color: '#F59E0B',
    aliases: ['COALICION CANARIA', 'COALICIÓN CANARIA', 'CC', 'CCa', '1.ºCAN-CCa', 'CCa-1.ºCAN'],
    prev2023: { seats: 1, pct: 0.47, note: 'CCa' },
  },
  {
    code: 'UPC',
    name: 'UNIDAD DEL PUEBLO CANARIO UPC (NC-BC, PODEMOS, IU, SUMAR)',
    shortName: 'UPC',
    color: '#0284C7',
    aliases: ['UPC', 'UNION DEL PUEBLO CANARIO', 'UNIÓN DEL PUEBLO CANARIO', 'UNIDAD DEL PUEBLO CANARIO', 'NC-BC'],
    prev2023: { seats: 1, pct: 0.61, note: 'Sumar Can. 0,43% + NC 0,18%' },
  },
  {
    code: 'SALF',
    name: 'SALF',
    shortName: 'SALF',
    color: '#78350F',
    aliases: ['SALF', 'SE ACABO LA FIESTA', 'SE ACABÓ LA FIESTA'],
  },
  {
    code: 'Ara Mès',
    name: 'ARAMÉS-FRONT AMPLI (ARAMÉS-EU-MS)',
    shortName: 'ARA MÈS',
    color: '#65A30D',
    aliases: ['ARA MES', 'ARA MÈS', 'ARA MÉS', 'ARAMES', 'MÉS', 'ARAMES-FRONT AMPLI', 'ARAMES-EU-MS'],
    prev2023: { seats: 1, pct: 0.34, note: 'Més-Sumar' },
  },
];

// 7 Partidos del Senado con su resultado de senadores electos en el 23J (2023)
export const SENATE_PARTIES: PartyConfig[] = [
  {
    code: 'PP',
    name: 'PP',
    shortName: 'PP',
    color: '#1D84CE',
    aliases: ['PP', 'PARTIDO POPULAR'],
    prev2023: { seats: 120 },
  },
  {
    code: 'Senado de Progreso',
    name: 'Senado de Progreso',
    shortName: 'SdP',
    color: '#E30613',
    aliases: ['SENADO DE PROGRESO', 'SDP', 'PSOE', 'PROGRESO', 'SENADO_DE_PROGRESO'],
    prev2023: { seats: 72, note: 'PSOE' },
  },
  {
    code: 'VOX',
    name: 'VOX',
    shortName: 'VOX',
    color: '#63BE21',
    aliases: ['VOX'],
    prev2023: { seats: 0 },
  },
  {
    code: 'ERC',
    name: 'ERC',
    shortName: 'ERC',
    color: '#FFB232',
    aliases: ['ERC', 'ESQUERRA', 'IZQUIERDAS POR LA INDEPENDENCIA'],
    prev2023: { seats: 3, note: 'Izquierdas por la Independencia' },
  },
  {
    code: 'Junts',
    name: 'Junts',
    shortName: 'JUNTS',
    color: '#00C3B2',
    aliases: ['JUNTS', 'JXCAT'],
    prev2023: { seats: 1 },
  },
  {
    code: 'PNV',
    name: 'PNV',
    shortName: 'PNV',
    color: '#008037',
    aliases: ['PNV', 'EAJ-PNV'],
    prev2023: { seats: 4 },
  },
  {
    code: 'EH Bildu',
    name: 'EH Bildu',
    shortName: 'BILDU',
    color: '#B5CF18',
    aliases: ['EH BILDU', 'EHBILDU', 'BILDU'],
    prev2023: { seats: 4, note: 'Izquierdas por la Independencia' },
  },
];

export const CONGRESS_PARTY_MAP: Record<string, PartyConfig> = Object.fromEntries(
  CONGRESS_PARTIES.map((p) => [p.code, p])
);

export const SENATE_PARTY_MAP: Record<string, PartyConfig> = Object.fromEntries(
  SENATE_PARTIES.map((p) => [p.code, p])
);

export function getPartyColor(partyCode: string): string {
  return (
    CONGRESS_PARTY_MAP[partyCode]?.color ||
    SENATE_PARTY_MAP[partyCode]?.color ||
    '#64748B'
  );
}

// Partidos base presentes en la mayoría de provincias (salvo donde Frente Amplio concurre integrado en otra candidatura autonómica)
const BASE_PROVINCIAL_PARTIES = ['PP', 'PSOE', 'VOX', 'Frente Amplio'];
const BASE_WITHOUT_FA_PARTIES = ['PP', 'PSOE', 'VOX'];

function buildProvincialParties(extraParties: string[] = [], includeFrenteAmplio = true): string[] {
  const base = includeFrenteAmplio ? BASE_PROVINCIAL_PARTIES : BASE_WITHOUT_FA_PARTIES;
  return [...base, ...extraParties];
}

// 52 circunscripciones (50 provincias + Ceuta y Melilla) = 350 escaños
// Nombres y coaliciones proclamadas en el BOE (BOE-A-2026-23103, de 3 de noviembre de 2026)
export const PROVINCES: ProvinceConfig[] = [
  {
    code: '01',
    name: 'Álava',
    region: 'País Vasco',
    seats: 4,
    parties: buildProvincialParties(['PNV', 'EH Bildu']),
    partyLabels: {
      PSOE: 'PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSOE) PSE-EE (PSOE)',
      'Frente Amplio': 'FRENTE AMPLIO-FRONTE ZABALA (FRENTE AMPLIO-FRONTE ZABALA)',
      PNV: 'EUZKO ALDERDI JELTZALEA-PARTIDO NACIONALISTA VASCO (EAJ-PNV)',
      'EH Bildu': 'EUSKAL HERRIA BILDU (EH BILDU)',
    },
  },
  { code: '02', name: 'Albacete', region: 'Castilla-La Mancha', seats: 4, parties: buildProvincialParties() },
  {
    code: '03',
    name: 'Alicante',
    region: 'Comunidad Valenciana',
    seats: 12,
    // En la C. Valenciana Compromís, Frente Amplio (EUPV), Podem y ERPV se presentan juntos
    parties: buildProvincialParties(['Compromìs'], false),
    partyLabels: {
      'Compromìs': 'COMPROMÍS: FRONT VALENCIÀ (COMPROMIS-EUPV-PODEM-ERPV)',
    },
  },
  {
    code: '04',
    name: 'Almería',
    region: 'Andalucía',
    seats: 6,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  { code: '05', name: 'Ávila', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  { code: '06', name: 'Badajoz', region: 'Extremadura', seats: 5, parties: buildProvincialParties() },
  {
    code: '07',
    name: 'Baleares',
    region: 'Illes Balears',
    seats: 8,
    // En Illes Balears Ara Més y Frente Amplio (EU-MS) se presentan juntos
    parties: buildProvincialParties(['Ara Mès'], false),
    partyLabels: {
      PSOE: 'PARTIDO SOCIALISTA DE LAS ISLAS BALEARES (PSIB-PSOE)',
      'Ara Mès': 'ARAMÉS-FRONT AMPLI (ARAMÉS-EU-MS)',
    },
  },
  {
    code: '08',
    name: 'Barcelona',
    region: 'Cataluña',
    seats: 32,
    parties: buildProvincialParties(['Junts', 'ERC']),
    partyLabels: {
      PP: 'PARTIT POPULAR / PARTIDO POPULAR (PP)',
      PSOE: 'PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) (PSC)',
      'Frente Amplio': 'Comuns-Front Ampli (COMUNS-FRONT AMPLI)',
      Junts: 'JUNTS PER CATALUNYA (JxCat)',
      ERC: 'ESQUERRA REPUBLICANA DE CATALUNYA (ERC)',
    },
  },
  { code: '09', name: 'Burgos', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  { code: '10', name: 'Cáceres', region: 'Extremadura', seats: 4, parties: buildProvincialParties() },
  {
    code: '11',
    name: 'Cádiz',
    region: 'Andalucía',
    seats: 8,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Frente Amplio': 'Frente Amplio Andaluz (FA)',
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  {
    code: '12',
    name: 'Castellón',
    region: 'Comunidad Valenciana',
    seats: 5,
    // En la C. Valenciana Compromís, Frente Amplio (EUPV), Podem y ERPV se presentan juntos
    parties: buildProvincialParties(['Compromìs'], false),
    partyLabels: {
      'Compromìs': 'COMPROMÍS: FRONT VALENCIÀ (COMPROMIS-EUPV-PODEM-ERPV)',
    },
  },
  { code: '13', name: 'Ciudad Real', region: 'Castilla-La Mancha', seats: 5, parties: buildProvincialParties() },
  {
    code: '14',
    name: 'Córdoba',
    region: 'Andalucía',
    seats: 6,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Frente Amplio': 'FRENTE AMPLIO ANDALUZ (FA)',
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  {
    code: '15',
    name: 'A Coruña',
    region: 'Galicia',
    seats: 8,
    parties: buildProvincialParties(['BNG']),
    partyLabels: {
      PSOE: 'Partido dos Socialistas de Galicia-PSOE (PSdeG-PSOE)',
      'Frente Amplio': 'Frente Amplio-Fronte Ampla (FRENTE AMPLIO-FRONTE AMPLA)',
      BNG: 'BLOQUE NACIONALISTA GALEGO (B.N.G.)',
    },
  },
  { code: '16', name: 'Cuenca', region: 'Castilla-La Mancha', seats: 3, parties: buildProvincialParties() },
  {
    code: '17',
    name: 'Girona',
    region: 'Cataluña',
    seats: 6,
    parties: buildProvincialParties(['Junts', 'ERC']),
    partyLabels: {
      PP: 'PARTIT POPULAR / PARTIDO POPULAR (PP)',
      PSOE: 'PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) (PSC)',
      'Frente Amplio': 'Comuns-Front Ampli (COMUNS-FRONT AMPLI)',
      Junts: 'JUNTS PER CATALUNYA (JxCat)',
      ERC: 'ESQUERRA REPUBLICANA DE CATALUNYA (ERC)',
    },
  },
  {
    code: '18',
    name: 'Granada',
    region: 'Andalucía',
    seats: 7,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Frente Amplio': 'Frente Amplio Andaluz (FA)',
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  { code: '19', name: 'Guadalajara', region: 'Castilla-La Mancha', seats: 3, parties: buildProvincialParties() },
  {
    code: '20',
    name: 'Gipuzkoa',
    region: 'País Vasco',
    seats: 6,
    parties: buildProvincialParties(['PNV', 'EH Bildu']),
    partyLabels: {
      PSOE: 'PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSOE) PSE-EE (PSOE)',
      PNV: 'EUZKO ALDERDI JELTZALEA-PARTIDO NACIONALISTA VASCO (EAJ-PNV)',
      'EH Bildu': 'EUSKAL HERRIA BILDU (EH BILDU)',
    },
  },
  {
    code: '21',
    name: 'Huelva',
    region: 'Andalucía',
    seats: 5,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      PSOE: 'PARTIDO SOCIALISTA DE HUELVA (PSOE)',
      'Frente Amplio': 'Frente Amplio Andaluz (FA)',
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  {
    code: '22',
    name: 'Huesca',
    region: 'Aragón',
    seats: 3,
    parties: buildProvincialParties(),
    partyLabels: {
      'Frente Amplio': 'CHUNTA ARAGONESISTA-FRENTE AMPLIO ARAGÓN (CHA-IU-MS-FRENTE AMPLIO)',
    },
  },
  {
    code: '23',
    name: 'Jaén',
    region: 'Andalucía',
    seats: 5,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  { code: '24', name: 'León', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  {
    code: '25',
    name: 'Lleida',
    region: 'Cataluña',
    seats: 4,
    parties: buildProvincialParties(['Junts', 'ERC']),
    partyLabels: {
      PSOE: 'PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) (PSC)',
      'Frente Amplio': 'Comuns-Front Ampli (COMUNS-FRONT AMPLI)',
      Junts: 'JUNTS PER CATALUNYA (JxCat)',
      ERC: 'ESQUERRA REPUBLICANA DE CATALUNYA (ERC)',
    },
  },
  { code: '26', name: 'La Rioja', region: 'La Rioja', seats: 4, parties: buildProvincialParties() },
  {
    code: '27',
    name: 'Lugo',
    region: 'Galicia',
    seats: 4,
    parties: buildProvincialParties(['BNG']),
    partyLabels: {
      PSOE: 'PARTIDO DOS SOCIALISTAS DE GALICIA-PSOE (PSdeG-PSOE)',
      'Frente Amplio': 'FRENTE AMPLIO-FRONTE AMPLA (FRENTE AMPLIO-FRONTE AMPLA)',
      BNG: 'BLOQUE NACIONALISTA GALEGO (BNG)',
    },
  },
  {
    code: '28',
    name: 'Madrid',
    region: 'Comunidad de Madrid',
    seats: 38,
    parties: buildProvincialParties(['Podemos', 'SALF']),
    partyLabels: {
      PODEMOS: 'PODEMOS (PODEMOS)',
      Podemos: 'PODEMOS (PODEMOS)',
      SALF: 'SE ACABÓ LA FIESTA (SALF)',
    },
  },
  {
    code: '29',
    name: 'Málaga',
    region: 'Andalucía',
    seats: 11,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  { code: '30', name: 'Murcia', region: 'Región de Murcia', seats: 10, parties: buildProvincialParties() },
  {
    code: '31',
    name: 'Navarra',
    region: 'Navarra',
    seats: 5,
    // En Navarra UPN y PP concurren juntos (UPN-PP) y EH Bildu concurre en coalición con ERC (EH BILDU-ERC)
    parties: buildProvincialParties(['EH Bildu']),
    partyLabels: {
      PP: 'UNIÓN DEL PUEBLO NAVARRO EN COALICIÓN CON EL PARTIDO POPULAR (UPN-PP)',
      PSOE: 'PARTIDO SOCIALISTA DE NAVARRA-PSOE (PSN-PSOE)',
      'Frente Amplio': 'Frente Amplio-Fronte Zabala (FRENTE AMPLIO-FRONTE ZABALA)',
      'EH Bildu': 'EUSKAL HERRIA BILDU-ESQUERRA REPUBLICANA DE CATALUNYA (EH BILDU-ERC)',
    },
  },
  {
    code: '32',
    name: 'Ourense',
    region: 'Galicia',
    seats: 4,
    parties: buildProvincialParties(['BNG']),
    partyLabels: {
      PSOE: 'Partido dos Socialistas de Galicia-PSOE (PSdeG-PSOE)',
      'Frente Amplio': 'Frente Amplio-Fronte Ampla (FRENTE AMPLIO-FRONTE AMPLA)',
      BNG: 'BLOQUE NACIONALISTA GALEGO (BNG)',
    },
  },
  {
    code: '33',
    name: 'Asturias',
    region: 'Principado de Asturias',
    seats: 7,
    parties: buildProvincialParties(),
    partyLabels: {
      'Frente Amplio': 'FRENTE AMPLIU POR ASTURIES (FA)',
    },
  },
  { code: '34', name: 'Palencia', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  {
    code: '35',
    name: 'Las Palmas',
    region: 'Canarias',
    seats: 8,
    // En Canarias UPC agrupa a NC-BC, Podemos, IU y Sumar (Frente Amplio) en una única candidatura
    parties: buildProvincialParties(['Coalición Canaria', 'UPC'], false),
    partyLabels: {
      'Coalición Canaria': 'MUNICIPALISTAS PRIMERO CANARIAS-COALICIÓN CANARIA (1.ºCAN-CCa)',
      UPC: 'UNIDAD DEL PUEBLO CANARIO UPC (NC-BC, PODEMOS, IU, SUMAR)',
    },
  },
  {
    code: '36',
    name: 'Pontevedra',
    region: 'Galicia',
    seats: 7,
    parties: buildProvincialParties(['BNG']),
    partyLabels: {
      PSOE: 'Partido dos Socialistas de Galicia-PSOE (PSdeG-PSOE)',
      'Frente Amplio': 'Frente Amplio - Fronte Ampla (FRENTE AMPLIO - FRONTE AMPLA)',
      BNG: 'BLOQUE NACIONALISTA GALEGO (BNG)',
    },
  },
  { code: '37', name: 'Salamanca', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  {
    code: '38',
    name: 'Santa Cruz de Tenerife',
    region: 'Canarias',
    seats: 7,
    // En Canarias UPC agrupa a NC-BC, Podemos, IU y Sumar (Frente Amplio) en una única candidatura
    parties: buildProvincialParties(['Coalición Canaria', 'UPC'], false),
    partyLabels: {
      'Coalición Canaria': 'Coalición Canaria-Municipalistas Primero Canarias (CCa-1.ºCAN)',
      UPC: 'UNIDAD DEL PUEBLO CANARIO UPC (NC-BC, PODEMOS, IU, SUMAR)',
    },
  },
  { code: '39', name: 'Cantabria', region: 'Cantabria', seats: 5, parties: buildProvincialParties() },
  { code: '40', name: 'Segovia', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  {
    code: '41',
    name: 'Sevilla',
    region: 'Andalucía',
    seats: 12,
    parties: buildProvincialParties(['Adelante Andalucía']),
    partyLabels: {
      'Frente Amplio': 'Frente Amplio Andaluz (FA)',
      'Adelante Andalucía': 'ADELANTE ANDALUCÍA (ADELANTE ANDALUCÍA)',
    },
  },
  { code: '42', name: 'Soria', region: 'Castilla y León', seats: 2, parties: buildProvincialParties() },
  {
    code: '43',
    name: 'Tarragona',
    region: 'Cataluña',
    seats: 6,
    parties: buildProvincialParties(['Junts', 'ERC']),
    partyLabels: {
      PP: 'PARTIT POPULAR / PARTIDO POPULAR (PP)',
      PSOE: 'PARTIT DELS SOCIALISTES DE CATALUNYA (PSC-PSOE) (PSC)',
      'Frente Amplio': 'Comuns-Front Ampli (COMUNS-FRONT AMPLI)',
      Junts: 'JUNTS PER CATALUNYA (JxCat)',
      ERC: 'ESQUERRA REPUBLICANA DE CATALUNYA (ERC)',
    },
  },
  { code: '44', name: 'Teruel', region: 'Aragón', seats: 3, parties: buildProvincialParties() },
  { code: '45', name: 'Toledo', region: 'Castilla-La Mancha', seats: 6, parties: buildProvincialParties() },
  {
    code: '46',
    name: 'Valencia',
    region: 'Comunidad Valenciana',
    seats: 16,
    // En la C. Valenciana Compromís, Frente Amplio (EUPV), Podem y ERPV se presentan juntos
    parties: buildProvincialParties(['Compromìs'], false),
    partyLabels: {
      'Compromìs': 'COMPROMÍS: FRONT VALENCIÀ (COMPROMIS-EUPV-PODEM-ERPV)',
    },
  },
  { code: '47', name: 'Valladolid', region: 'Castilla y León', seats: 5, parties: buildProvincialParties() },
  {
    code: '48',
    name: 'Bizkaia',
    region: 'País Vasco',
    seats: 8,
    parties: buildProvincialParties(['PNV', 'EH Bildu']),
    partyLabels: {
      PSOE: 'PARTIDO SOCIALISTA DE EUSKADI-EUSKADIKO EZKERRA (PSOE) PSE-EE (PSOE)',
      PNV: 'EUZKO ALDERDI JELTZALEA-PARTIDO NACIONALISTA VASCO (EAJ-PNV)',
      'EH Bildu': 'EUSKAL HERRIA BILDU (EH Bildu)',
    },
  },
  { code: '49', name: 'Zamora', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  {
    code: '50',
    name: 'Zaragoza',
    region: 'Aragón',
    seats: 7,
    parties: buildProvincialParties(),
    partyLabels: {
      'Frente Amplio': 'Chunta Aragonesista-Frente Amplio Aragón (CHA-IU-MS-FRENTE AMPLIO)',
    },
  },
  { code: '51', name: 'Ceuta', region: 'Ceuta', seats: 1, parties: buildProvincialParties() },
  { code: '52', name: 'Melilla', region: 'Melilla', seats: 1, parties: buildProvincialParties() },
];

export const PROVINCE_MAP: Record<string, ProvinceConfig> = Object.fromEntries(
  PROVINCES.map((prov) => [prov.code, prov])
);

export function getProvincePartyLabel(provinceCode: string, partyCode: string): string {
  const prov = PROVINCE_MAP[provinceCode];
  if (prov?.partyLabels?.[partyCode]) {
    return prov.partyLabels[partyCode];
  }
  return CONGRESS_PARTY_MAP[partyCode]?.name || partyCode;
}

export function getProvincePartyConfigs(provinceCode: string): PartyConfig[] {
  const prov = PROVINCE_MAP[provinceCode];
  if (!prov) return [];
  return prov.parties
    .map((code) => CONGRESS_PARTY_MAP[code])
    .filter((p): p is PartyConfig => Boolean(p));
}

// Resultados oficiales de las elecciones generales del 23J (2023) por circunscripción
export const PROVINCE_PREV_2023: Record<string, Record<string, PrevElectionResult>> = {
  '01': {
    PP: { pct: 17.87, seats: 1 },
    PSOE: { pct: 27.66, seats: 1 },
    VOX: { pct: 3.89, seats: 0 },
    'Frente Amplio': { pct: 12.75, seats: 0, note: 'Sumar' },
    PNV: { pct: 16.6, seats: 1 },
    'EH Bildu': { pct: 19.51, seats: 1 },
  },
  '02': {
    PP: { pct: 39.92, seats: 2 },
    PSOE: { pct: 34.51, seats: 2 },
    VOX: { pct: 16.61, seats: 0 },
    'Frente Amplio': { pct: 7.16, seats: 0, note: 'Sumar' },
  },
  '03': {
    PP: { pct: 36.73, seats: 5 },
    PSOE: { pct: 32.0, seats: 4 },
    VOX: { pct: 16.25, seats: 2 },
    'Compromìs': { pct: 12.88, seats: 1, note: 'Compromís-Sumar' },
  },
  '04': {
    PP: { pct: 40.94, seats: 3 },
    PSOE: { pct: 29.04, seats: 2 },
    VOX: { pct: 21.28, seats: 1 },
    'Frente Amplio': { pct: 6.69, seats: 0, note: 'Sumar' },
  },
  '05': {
    PP: { pct: 43.25, seats: 2 },
    PSOE: { pct: 27.39, seats: 1 },
    VOX: { pct: 15.38, seats: 0 },
    'Frente Amplio': { pct: 5.13, seats: 0, note: 'Sumar' },
  },
  '06': {
    PP: { pct: 37.82, seats: 2 },
    PSOE: { pct: 39.21, seats: 2 },
    VOX: { pct: 13.66, seats: 1 },
    'Frente Amplio': { pct: 6.84, seats: 0, note: 'Sumar' },
  },
  '07': {
    PP: { pct: 35.63, seats: 3 },
    PSOE: { pct: 30.16, seats: 3 },
    VOX: { pct: 15.21, seats: 1 },
    'Ara Mès': { pct: 16.59, seats: 1, note: 'Més-Sumar' },
  },
  '08': {
    PP: { pct: 13.78, seats: 5 },
    PSOE: { pct: 35.7, seats: 13 },
    VOX: { pct: 7.56, seats: 2 },
    'Frente Amplio': { pct: 15.22, seats: 5, note: 'Sumar - ECP' },
    ERC: { pct: 12.32, seats: 4 },
    Junts: { pct: 9.68, seats: 3 },
  },
  '09': {
    PP: { pct: 40.64, seats: 2 },
    PSOE: { pct: 34.45, seats: 2 },
    VOX: { pct: 12.77, seats: 0 },
    'Frente Amplio': { pct: 8.64, seats: 0, note: 'Sumar' },
  },
  '10': {
    PP: { pct: 38.0, seats: 2 },
    PSOE: { pct: 38.88, seats: 2 },
    VOX: { pct: 13.6, seats: 0 },
    'Frente Amplio': { pct: 6.93, seats: 0, note: 'Sumar' },
  },
  '11': {
    PP: { pct: 34.8, seats: 4 },
    PSOE: { pct: 33.15, seats: 3 },
    VOX: { pct: 15.18, seats: 1 },
    'Frente Amplio': { pct: 12.89, seats: 1, note: 'Sumar' },
    'Adelante Andalucía': { pct: 1.44, seats: 0 },
  },
  '12': {
    PP: { pct: 35.17, seats: 2 },
    PSOE: { pct: 32.65, seats: 2 },
    VOX: { pct: 15.88, seats: 1 },
    'Compromìs': { pct: 14.35, seats: 0, note: 'Compromís-Sumar' },
  },
  '13': {
    PP: { pct: 40.54, seats: 2 },
    PSOE: { pct: 35.37, seats: 2 },
    VOX: { pct: 16.27, seats: 1 },
    'Frente Amplio': { pct: 6.15, seats: 0, note: 'Sumar' },
  },
  '14': {
    PP: { pct: 37.89, seats: 2 },
    PSOE: { pct: 32.12, seats: 2 },
    VOX: { pct: 13.94, seats: 1 },
    'Frente Amplio': { pct: 13.73, seats: 1, note: 'Sumar' },
  },
  '15': {
    PP: { pct: 43.13, seats: 4 },
    PSOE: { pct: 28.17, seats: 2 },
    VOX: { pct: 5.08, seats: 0 },
    'Frente Amplio': { pct: 12.19, seats: 1, note: 'Sumar' },
    BNG: { pct: 9.98, seats: 1 },
  },
  '16': {
    PP: { pct: 39.76, seats: 2 },
    PSOE: { pct: 37.37, seats: 1 },
    VOX: { pct: 15.55, seats: 0 },
    'Frente Amplio': { pct: 5.56, seats: 0, note: 'Sumar' },
  },
  '17': {
    PP: { pct: 9.7, seats: 0 },
    PSOE: { pct: 28.93, seats: 2 },
    VOX: { pct: 7.03, seats: 0 },
    'Frente Amplio': { pct: 10.94, seats: 1, note: 'Sumar - ECP' },
    ERC: { pct: 14.72, seats: 1 },
    Junts: { pct: 19.58, seats: 2 },
  },
  '18': {
    PP: { pct: 36.99, seats: 3 },
    PSOE: { pct: 32.98, seats: 2 },
    VOX: { pct: 16.12, seats: 1 },
    'Frente Amplio': { pct: 11.65, seats: 1, note: 'Sumar' },
  },
  '19': {
    PP: { pct: 36.33, seats: 1 },
    PSOE: { pct: 32.98, seats: 1 },
    VOX: { pct: 19.25, seats: 1 },
    'Frente Amplio': { pct: 9.16, seats: 0, note: 'Sumar' },
  },
  '20': {
    PP: { pct: 8.69, seats: 0 },
    PSOE: { pct: 23.29, seats: 2 },
    VOX: { pct: 2.09, seats: 0 },
    'Frente Amplio': { pct: 10.64, seats: 0, note: 'Sumar' },
    PNV: { pct: 22.58, seats: 2 },
    'EH Bildu': { pct: 31.15, seats: 2 },
  },
  '21': {
    PP: { pct: 36.43, seats: 2 },
    PSOE: { pct: 35.95, seats: 2 },
    VOX: { pct: 14.63, seats: 1 },
    'Frente Amplio': { pct: 10.42, seats: 0, note: 'Sumar' },
  },
  '22': {
    PP: { pct: 38.19, seats: 2 },
    PSOE: { pct: 33.62, seats: 1 },
    VOX: { pct: 12.64, seats: 0 },
    'Frente Amplio': { pct: 11.49, seats: 0, note: 'Sumar Aragón' },
  },
  '23': {
    PP: { pct: 37.32, seats: 2 },
    PSOE: { pct: 36.29, seats: 2 },
    VOX: { pct: 14.75, seats: 1 },
    'Frente Amplio': { pct: 7.99, seats: 0, note: 'Sumar' },
  },
  '24': {
    PP: { pct: 36.92, seats: 2 },
    PSOE: { pct: 33.64, seats: 2 },
    VOX: { pct: 12.88, seats: 0 },
    'Frente Amplio': { pct: 6.75, seats: 0, note: 'Sumar' },
  },
  '25': {
    PP: { pct: 12.84, seats: 0 },
    PSOE: { pct: 29.49, seats: 2 },
    VOX: { pct: 6.81, seats: 0 },
    'Frente Amplio': { pct: 7.89, seats: 0, note: 'Sumar - ECP' },
    ERC: { pct: 18.6, seats: 1 },
    Junts: { pct: 18.01, seats: 1 },
  },
  '26': {
    PP: { pct: 45.64, seats: 2 },
    PSOE: { pct: 35.68, seats: 2 },
    VOX: { pct: 9.77, seats: 0 },
    'Frente Amplio': { pct: 6.57, seats: 0, note: 'Sumar' },
  },
  '27': {
    PP: { pct: 50.24, seats: 3 },
    PSOE: { pct: 30.3, seats: 1 },
    VOX: { pct: 4.35, seats: 0 },
    'Frente Amplio': { pct: 5.18, seats: 0, note: 'Sumar' },
    BNG: { pct: 8.66, seats: 0 },
  },
  '28': {
    PP: { pct: 40.55, seats: 16 },
    PSOE: { pct: 27.84, seats: 10 },
    VOX: { pct: 14.03, seats: 5 },
    'Frente Amplio': { pct: 15.46, seats: 6, note: 'Sumar' },
  },
  '29': {
    PP: { pct: 38.31, seats: 5 },
    PSOE: { pct: 30.34, seats: 3 },
    VOX: { pct: 16.46, seats: 2 },
    'Frente Amplio': { pct: 12.26, seats: 1, note: 'Sumar' },
  },
  '30': {
    PP: { pct: 41.18, seats: 4 },
    PSOE: { pct: 25.3, seats: 3 },
    VOX: { pct: 21.81, seats: 2 },
    'Frente Amplio': { pct: 9.57, seats: 1, note: 'Sumar' },
  },
  '31': {
    PP: { pct: 31.98, seats: 2, note: 'PP 16,71% (1) + UPN 15,27% (1)' },
    PSOE: { pct: 27.37, seats: 2 },
    VOX: { pct: 5.7, seats: 0 },
    'Frente Amplio': { pct: 12.85, seats: 0, note: 'Sumar' },
    'EH Bildu': { pct: 17.25, seats: 1 },
  },
  '32': {
    PP: { pct: 50.02, seats: 3 },
    PSOE: { pct: 30.08, seats: 1 },
    VOX: { pct: 4.87, seats: 0 },
    'Frente Amplio': { pct: 5.46, seats: 0, note: 'Sumar' },
    BNG: { pct: 8.22, seats: 0 },
  },
  '33': {
    PP: { pct: 35.65, seats: 3 },
    PSOE: { pct: 34.34, seats: 2 },
    VOX: { pct: 12.49, seats: 1 },
    'Frente Amplio': { pct: 14.85, seats: 1, note: 'Sumar' },
  },
  '34': {
    PP: { pct: 41.98, seats: 2 },
    PSOE: { pct: 34.67, seats: 1 },
    VOX: { pct: 12.9, seats: 0 },
    'Frente Amplio': { pct: 6.06, seats: 0, note: 'Sumar' },
  },
  '35': {
    PP: { pct: 25.85, seats: 3 },
    PSOE: { pct: 33.19, seats: 3 },
    VOX: { pct: 14.61, seats: 1 },
    UPC: { pct: 18.29, seats: 1, note: 'Sumar 10,27% (1) + NC 8,02% (0)' },
    'Coalición Canaria': { pct: 6.34, seats: 0, note: 'CCa' },
  },
  '36': {
    PP: { pct: 39.72, seats: 3 },
    PSOE: { pct: 31.36, seats: 3 },
    VOX: { pct: 4.81, seats: 0 },
    'Frente Amplio': { pct: 13.19, seats: 1, note: 'Sumar' },
    BNG: { pct: 9.39, seats: 0 },
  },
  '37': {
    PP: { pct: 46.87, seats: 3 },
    PSOE: { pct: 30.49, seats: 1 },
    VOX: { pct: 14.67, seats: 0 },
    'Frente Amplio': { pct: 5.53, seats: 0, note: 'Sumar' },
  },
  '38': {
    PP: { pct: 35.35, seats: 3 },
    PSOE: { pct: 33.49, seats: 3 },
    UPC: { pct: 11.49, seats: 0, note: 'Sumar 10,85% (0) + NC 0,64% (0)' },
    'Coalición Canaria': { pct: 16.75, seats: 1, note: 'CCa' },
  },
  '39': {
    PP: { pct: 42.08, seats: 2 },
    PSOE: { pct: 33.3, seats: 2 },
    VOX: { pct: 14.06, seats: 1 },
    'Frente Amplio': { pct: 8.49, seats: 0, note: 'Sumar' },
  },
  '40': {
    PP: { pct: 45.02, seats: 2 },
    PSOE: { pct: 30.6, seats: 1 },
    VOX: { pct: 14.12, seats: 0 },
    'Frente Amplio': { pct: 8.05, seats: 0, note: 'Sumar' },
  },
  '41': {
    PP: { pct: 33.38, seats: 4 },
    PSOE: { pct: 36.6, seats: 5 },
    VOX: { pct: 13.32, seats: 1 },
    'Frente Amplio': { pct: 14.04, seats: 2, note: 'Sumar' },
  },
  '42': {
    PP: { pct: 37.22, seats: 1 },
    PSOE: { pct: 29.48, seats: 1 },
    VOX: { pct: 9.81, seats: 0 },
    'Frente Amplio': { pct: 3.37, seats: 0, note: 'Sumar' },
  },
  '43': {
    PP: { pct: 13.87, seats: 1 },
    PSOE: { pct: 32.91, seats: 2 },
    VOX: { pct: 10.34, seats: 0 },
    'Frente Amplio': { pct: 11.34, seats: 1, note: 'Sumar - ECP' },
    ERC: { pct: 15.07, seats: 1 },
    Junts: { pct: 11.08, seats: 1 },
  },
  '44': {
    PP: { pct: 35.02, seats: 2 },
    PSOE: { pct: 29.28, seats: 1 },
    VOX: { pct: 13.08, seats: 0 },
    'Frente Amplio': { pct: 5.44, seats: 0, note: 'Sumar' },
  },
  '45': {
    PP: { pct: 37.84, seats: 3 },
    PSOE: { pct: 32.56, seats: 2 },
    VOX: { pct: 19.64, seats: 1 },
    'Frente Amplio': { pct: 8.23, seats: 0, note: 'Sumar' },
  },
  '46': {
    PP: { pct: 33.64, seats: 6 },
    PSOE: { pct: 32.1, seats: 5 },
    VOX: { pct: 15.21, seats: 2 },
    'Compromìs': { pct: 16.9, seats: 3, note: 'Compromís-Sumar' },
  },
  '47': {
    PP: { pct: 40.84, seats: 2 },
    PSOE: { pct: 32.75, seats: 2 },
    VOX: { pct: 15.16, seats: 1 },
    'Frente Amplio': { pct: 8.87, seats: 0, note: 'Sumar' },
  },
  '48': {
    PP: { pct: 11.57, seats: 1 },
    PSOE: { pct: 25.82, seats: 2 },
    VOX: { pct: 2.64, seats: 0 },
    'Frente Amplio': { pct: 10.92, seats: 1, note: 'Sumar' },
    PNV: { pct: 26.93, seats: 2 },
    'EH Bildu': { pct: 20.64, seats: 2 },
  },
  '49': {
    PP: { pct: 44.67, seats: 2 },
    PSOE: { pct: 32.49, seats: 1 },
    VOX: { pct: 13.2, seats: 0 },
    'Frente Amplio': { pct: 5.65, seats: 0, note: 'Sumar' },
  },
  '50': {
    PP: { pct: 36.01, seats: 3 },
    PSOE: { pct: 30.82, seats: 2 },
    VOX: { pct: 15.3, seats: 1 },
    'Frente Amplio': { pct: 13.48, seats: 1, note: 'Sumar Aragón' },
  },
  '51': {
    PP: { pct: 38.77, seats: 1 },
    PSOE: { pct: 34.01, seats: 0 },
    VOX: { pct: 23.26, seats: 0 },
    'Frente Amplio': { pct: 2.46, seats: 0, note: 'Sumar' },
  },
  '52': {
    PP: { pct: 49.16, seats: 1 },
    PSOE: { pct: 25.39, seats: 0 },
    VOX: { pct: 15.94, seats: 0 },
    'Frente Amplio': { pct: 3.02, seats: 0, note: 'Sumar' },
  },
};

export function getProvincePartyPrev2023(
  provinceCode: string,
  partyCode: string
): PrevElectionResult | undefined {
  return PROVINCE_PREV_2023[provinceCode]?.[partyCode];
}
