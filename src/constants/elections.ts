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
    name: 'Compromìs',
    shortName: 'COMP',
    color: '#F37021',
    aliases: ['COMPROMIS', 'COMPROMÌS', 'COMPROMÍS', 'COMP'],
  },
  {
    code: 'Coalición Canaria',
    name: 'Coalición Canaria',
    shortName: 'CC',
    color: '#F59E0B',
    aliases: ['COALICION CANARIA', 'COALICIÓN CANARIA', 'CC', 'CCa'],
  },
  {
    code: 'UPC',
    name: 'UPC',
    shortName: 'UPC',
    color: '#0284C7',
    aliases: ['UPC', 'UNION DEL PUEBLO CANARIO', 'UNIÓN DEL PUEBLO CANARIO'],
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
    name: 'Ara Mès',
    shortName: 'ARA MÈS',
    color: '#65A30D',
    aliases: ['ARA MES', 'ARA MÈS', 'ARA MÉS', 'ARAMES', 'MÉS'],
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

// Partidos base presentes en todas las provincias
const BASE_PROVINCIAL_PARTIES = ['PP', 'PSOE', 'VOX', 'Frente Amplio'];

function buildProvincialParties(extraParties: string[] = []): string[] {
  return [...BASE_PROVINCIAL_PARTIES, ...extraParties];
}

// 52 circunscripciones (50 provincias + Ceuta y Melilla) = 350 escaños
export const PROVINCES: ProvinceConfig[] = [
  { code: '01', name: 'Álava', region: 'País Vasco', seats: 4, parties: buildProvincialParties(['PNV', 'EH Bildu']) },
  { code: '02', name: 'Albacete', region: 'Castilla-La Mancha', seats: 4, parties: buildProvincialParties() },
  { code: '03', name: 'Alicante', region: 'Comunidad Valenciana', seats: 12, parties: buildProvincialParties(['Compromìs']) },
  { code: '04', name: 'Almería', region: 'Andalucía', seats: 6, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '05', name: 'Ávila', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  { code: '06', name: 'Badajoz', region: 'Extremadura', seats: 5, parties: buildProvincialParties() },
  { code: '07', name: 'Baleares', region: 'Illes Balears', seats: 8, parties: buildProvincialParties(['Ara Mès']) },
  { code: '08', name: 'Barcelona', region: 'Cataluña', seats: 32, parties: buildProvincialParties(['Junts', 'ERC']) },
  { code: '09', name: 'Burgos', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  { code: '10', name: 'Cáceres', region: 'Extremadura', seats: 4, parties: buildProvincialParties() },
  { code: '11', name: 'Cádiz', region: 'Andalucía', seats: 9, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '12', name: 'Castellón', region: 'Comunidad Valenciana', seats: 5, parties: buildProvincialParties(['Compromìs']) },
  { code: '13', name: 'Ciudad Real', region: 'Castilla-La Mancha', seats: 5, parties: buildProvincialParties() },
  { code: '14', name: 'Córdoba', region: 'Andalucía', seats: 6, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '15', name: 'A Coruña', region: 'Galicia', seats: 8, parties: buildProvincialParties(['BNG']) },
  { code: '16', name: 'Cuenca', region: 'Castilla-La Mancha', seats: 3, parties: buildProvincialParties() },
  { code: '17', name: 'Girona', region: 'Cataluña', seats: 6, parties: buildProvincialParties(['Junts', 'ERC']) },
  { code: '18', name: 'Granada', region: 'Andalucía', seats: 7, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '19', name: 'Guadalajara', region: 'Castilla-La Mancha', seats: 3, parties: buildProvincialParties() },
  { code: '20', name: 'Gipuzkoa', region: 'País Vasco', seats: 6, parties: buildProvincialParties(['PNV', 'EH Bildu']) },
  { code: '21', name: 'Huelva', region: 'Andalucía', seats: 5, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '22', name: 'Huesca', region: 'Aragón', seats: 3, parties: buildProvincialParties() },
  { code: '23', name: 'Jaén', region: 'Andalucía', seats: 5, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '24', name: 'León', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  { code: '25', name: 'Lleida', region: 'Cataluña', seats: 4, parties: buildProvincialParties(['Junts', 'ERC']) },
  { code: '26', name: 'La Rioja', region: 'La Rioja', seats: 4, parties: buildProvincialParties() },
  { code: '27', name: 'Lugo', region: 'Galicia', seats: 4, parties: buildProvincialParties(['BNG']) },
  { code: '28', name: 'Madrid', region: 'Comunidad de Madrid', seats: 37, parties: buildProvincialParties(['Podemos', 'SALF']) },
  { code: '29', name: 'Málaga', region: 'Andalucía', seats: 11, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '30', name: 'Murcia', region: 'Región de Murcia', seats: 10, parties: buildProvincialParties() },
  { code: '31', name: 'Navarra', region: 'Navarra', seats: 5, parties: buildProvincialParties(['EH Bildu']) },
  { code: '32', name: 'Ourense', region: 'Galicia', seats: 4, parties: buildProvincialParties(['BNG']) },
  { code: '33', name: 'Asturias', region: 'Principado de Asturias', seats: 7, parties: buildProvincialParties() },
  { code: '34', name: 'Palencia', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  { code: '35', name: 'Las Palmas', region: 'Canarias', seats: 8, parties: buildProvincialParties(['Coalición Canaria', 'UPC']) },
  { code: '36', name: 'Pontevedra', region: 'Galicia', seats: 7, parties: buildProvincialParties(['BNG']) },
  { code: '37', name: 'Salamanca', region: 'Castilla y León', seats: 4, parties: buildProvincialParties() },
  { code: '38', name: 'Santa Cruz de Tenerife', region: 'Canarias', seats: 7, parties: buildProvincialParties(['Coalición Canaria', 'UPC']) },
  { code: '39', name: 'Cantabria', region: 'Cantabria', seats: 5, parties: buildProvincialParties() },
  { code: '40', name: 'Segovia', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  { code: '41', name: 'Sevilla', region: 'Andalucía', seats: 12, parties: buildProvincialParties(['Adelante Andalucía']) },
  { code: '42', name: 'Soria', region: 'Castilla y León', seats: 2, parties: buildProvincialParties() },
  { code: '43', name: 'Tarragona', region: 'Cataluña', seats: 6, parties: buildProvincialParties(['Junts', 'ERC']) },
  { code: '44', name: 'Teruel', region: 'Aragón', seats: 3, parties: buildProvincialParties() },
  { code: '45', name: 'Toledo', region: 'Castilla-La Mancha', seats: 6, parties: buildProvincialParties() },
  { code: '46', name: 'Valencia', region: 'Comunidad Valenciana', seats: 16, parties: buildProvincialParties(['Compromìs']) },
  { code: '47', name: 'Valladolid', region: 'Castilla y León', seats: 5, parties: buildProvincialParties() },
  { code: '48', name: 'Bizkaia', region: 'País Vasco', seats: 8, parties: buildProvincialParties(['PNV', 'EH Bildu']) },
  { code: '49', name: 'Zamora', region: 'Castilla y León', seats: 3, parties: buildProvincialParties() },
  { code: '50', name: 'Zaragoza', region: 'Aragón', seats: 7, parties: buildProvincialParties() },
  { code: '51', name: 'Ceuta', region: 'Ceuta', seats: 1, parties: buildProvincialParties() },
  { code: '52', name: 'Melilla', region: 'Melilla', seats: 1, parties: buildProvincialParties() },
];

export const PROVINCE_MAP: Record<string, ProvinceConfig> = Object.fromEntries(
  PROVINCES.map((prov) => [prov.code, prov])
);

export function getProvincePartyConfigs(provinceCode: string): PartyConfig[] {
  const prov = PROVINCE_MAP[provinceCode];
  if (!prov) return [];
  return prov.parties
    .map((code) => CONGRESS_PARTY_MAP[code])
    .filter((p): p is PartyConfig => Boolean(p));
}
