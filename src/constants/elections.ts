export interface PartyConfig {
  code: string;
  name: string;
  shortName: string;
  color: string;
  aliases: string[];
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

// 16 Partidos del Congreso con sus colores corporativos y siglas
export const CONGRESS_PARTIES: PartyConfig[] = [
  {
    code: 'PP',
    name: 'PP',
    shortName: 'PP',
    color: '#1D84CE',
    aliases: ['PP', 'PARTIDO POPULAR'],
  },
  {
    code: 'PSOE',
    name: 'PSOE',
    shortName: 'PSOE',
    color: '#E30613',
    aliases: ['PSOE', 'PSC', 'PSOE-A', 'PSDEG', 'PSE-EE'],
  },
  {
    code: 'VOX',
    name: 'VOX',
    shortName: 'VOX',
    color: '#63BE21',
    aliases: ['VOX'],
  },
  {
    code: 'Frente Amplio',
    name: 'Frente Amplio',
    shortName: 'FA',
    color: '#E51C55',
    aliases: ['FRENTE AMPLIO', 'FA', 'FRENTE_AMPLIO', 'SUMAR'],
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
  },
  {
    code: 'Junts',
    name: 'Junts',
    shortName: 'JUNTS',
    color: '#00C3B2',
    aliases: ['JUNTS', 'JXCAT', 'JUNTS PER CATALUNYA'],
  },
  {
    code: 'BNG',
    name: 'BNG',
    shortName: 'BNG',
    color: '#76B3E1',
    aliases: ['BNG', 'BLOQUE NACIONALISTA GALEGO'],
  },
  {
    code: 'PNV',
    name: 'PNV',
    shortName: 'PNV',
    color: '#008037',
    aliases: ['PNV', 'EAJ-PNV', 'EAJPNV'],
  },
  {
    code: 'EH Bildu',
    name: 'EH Bildu',
    shortName: 'BILDU',
    color: '#B5CF18',
    aliases: ['EH BILDU', 'EHBILDU', 'BILDU'],
  },
  {
    code: 'Adelante Andalucía',
    name: 'Adelante Andalucía',
    shortName: 'AA',
    color: '#00965E',
    aliases: ['ADELANTE ANDALUCIA', 'ADELANTE ANDALUCÍA', 'AA', 'ADELANTE_ANDALUCIA'],
  },
  {
    code: 'Compromìs',
    name: 'COMPROMÍS: FRONT VALENCIÀ (COMPROMIS-EUPV-PODEM-ERPV)',
    shortName: 'COMP',
    color: '#F37021',
    aliases: ['COMPROMIS', 'COMPROMÌS', 'COMPROMÍS', 'COMP', 'FRONT VALENCIA', 'COMPROMIS-EUPV-PODEM-ERPV'],
  },
  {
    code: 'Coalición Canaria',
    name: 'COALICIÓN CANARIA (CCa-1.ºCAN)',
    shortName: 'CC',
    color: '#F59E0B',
    aliases: ['COALICION CANARIA', 'COALICIÓN CANARIA', 'CC', 'CCa', '1.ºCAN-CCa', 'CCa-1.ºCAN'],
  },
  {
    code: 'UPC',
    name: 'UNIDAD DEL PUEBLO CANARIO UPC (NC-BC, PODEMOS, IU, SUMAR)',
    shortName: 'UPC',
    color: '#0284C7',
    aliases: ['UPC', 'UNION DEL PUEBLO CANARIO', 'UNIÓN DEL PUEBLO CANARIO', 'UNIDAD DEL PUEBLO CANARIO', 'NC-BC'],
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
  },
];

// 7 Partidos del Senado
export const SENATE_PARTIES: PartyConfig[] = [
  {
    code: 'PP',
    name: 'PP',
    shortName: 'PP',
    color: '#1D84CE',
    aliases: ['PP', 'PARTIDO POPULAR'],
  },
  {
    code: 'Senado de Progreso',
    name: 'Senado de Progreso',
    shortName: 'SdP',
    color: '#E30613',
    aliases: ['SENADO DE PROGRESO', 'SDP', 'PSOE', 'PROGRESO', 'SENADO_DE_PROGRESO'],
  },
  {
    code: 'VOX',
    name: 'VOX',
    shortName: 'VOX',
    color: '#63BE21',
    aliases: ['VOX'],
  },
  {
    code: 'ERC',
    name: 'ERC',
    shortName: 'ERC',
    color: '#FFB232',
    aliases: ['ERC', 'ESQUERRA', 'IZQUIERDAS POR LA INDEPENDENCIA'],
  },
  {
    code: 'Junts',
    name: 'Junts',
    shortName: 'JUNTS',
    color: '#00C3B2',
    aliases: ['JUNTS', 'JXCAT'],
  },
  {
    code: 'PNV',
    name: 'PNV',
    shortName: 'PNV',
    color: '#008037',
    aliases: ['PNV', 'EAJ-PNV'],
  },
  {
    code: 'EH Bildu',
    name: 'EH Bildu',
    shortName: 'BILDU',
    color: '#B5CF18',
    aliases: ['EH BILDU', 'EHBILDU', 'BILDU'],
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
