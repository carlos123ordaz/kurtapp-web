// Static catalog data for cotizaciones module

export interface Brand {
  id: string
  name: string
  dept: string
  color: string
}

export interface Family {
  id: string
  name: string
  icon: string
}

export interface CatalogItem {
  sku: string
  brand: string
  family: string
  name: string
  currency: 'US$' | 'EUR'
  listPrice: number
  uom: string
  isService?: boolean
}

export interface Department {
  id: string
  name: string
  desc: string
}

export interface Person {
  id: string
  name: string
  initials: string
  color: string
}

export const BRANDS: Brand[] = [
  { id: 'EH',   name: 'Endress+Hauser',   dept: 'UNAI',     color: '#0066B3' },
  { id: 'WIKA', name: 'WIKA',             dept: 'UNAU',     color: '#FFD200' },
  { id: 'ROT',  name: 'Rotork',           dept: 'UNVA',     color: '#E30613' },
  { id: 'VAL',  name: 'Valmet',           dept: 'UNAU',     color: '#0F2D52' },
  { id: 'KRO',  name: 'KROHNE',           dept: 'UNAI',     color: '#0A4B8C' },
  { id: 'SAM',  name: 'Samson',           dept: 'UNVA',     color: '#0085CA' },
  { id: 'EMR',  name: 'Emerson',          dept: 'UNAI',     color: '#00873E' },
  { id: 'AFR',  name: 'AFRISO',           dept: 'PAU',      color: '#003D7A' },
  { id: 'PEP',  name: 'Pepperl+Fuchs',   dept: 'PIC',      color: '#00A0DC' },
  { id: 'CRS',  name: 'Servicios Corsusa', dept: 'Servicios', color: '#0F766E' },
]

export const FAMILIES: Family[] = [
  { id: 'flow',  name: 'Flujo',       icon: '◐' },
  { id: 'level', name: 'Nivel',       icon: '▤' },
  { id: 'pres',  name: 'Presión',     icon: '◯' },
  { id: 'temp',  name: 'Temperatura', icon: '↟' },
  { id: 'anly',  name: 'Análisis',    icon: '◇' },
  { id: 'valv',  name: 'Válvulas',    icon: '⊗' },
  { id: 'svc',   name: 'Servicios',   icon: '⌬' },
  { id: 'proj',  name: 'Proyectos',   icon: '▣' },
]

export const CATALOG: CatalogItem[] = [
  // Endress+Hauser — Flujo
  { sku: '5P5B2K-AABCBAABA2GA', brand: 'EH',   family: 'flow',  name: 'Promass F 300 DN50 — Caudalímetro másico Coriolis',       currency: 'EUR', listPrice: 8420.00, uom: 'UN' },
  { sku: '5W4B40-ABCCAAGAAABA', brand: 'EH',   family: 'flow',  name: 'Promag W 400 DN80 — Caudalímetro electromagnético',       currency: 'EUR', listPrice: 4150.00, uom: 'UN' },
  { sku: '5T1B30-AACCAAGAAA1A', brand: 'EH',   family: 'flow',  name: 'Prosonic Flow 91W — Caudalímetro ultrasónico DN100',      currency: 'EUR', listPrice: 6280.00, uom: 'UN' },
  // E+H — Nivel
  { sku: 'FMR62-AABCAAA32A2A',  brand: 'EH',   family: 'level', name: 'Micropilot FMR62 — Radar de nivel 80GHz 30m',             currency: 'EUR', listPrice: 3890.00, uom: 'UN' },
  { sku: 'FTL51-AAB2BB4D5A',    brand: 'EH',   family: 'level', name: 'Liquiphant FTL51 — Detector vibratorio de nivel',         currency: 'EUR', listPrice: 1240.00, uom: 'UN' },
  // E+H — Presión
  { sku: 'PMC71-AAB1L1GBAAA',   brand: 'EH',   family: 'pres',  name: 'Cerabar PMC71 — Transmisor de presión absoluta 0-10 bar', currency: 'EUR', listPrice: 1880.00, uom: 'UN' },
  // E+H — Temperatura
  { sku: 'TMT82-A1A3GB',        brand: 'EH',   family: 'temp',  name: 'iTEMP TMT82 — Transmisor de temperatura HART 4-20mA',    currency: 'EUR', listPrice: 540.00,  uom: 'UN' },
  { sku: 'TST310-A1AAA1H',      brand: 'EH',   family: 'temp',  name: 'Omnigrad TST310 — RTD Pt100 con vaina 6mm L=250mm',      currency: 'EUR', listPrice: 320.00,  uom: 'UN' },
  // E+H — Análisis
  { sku: 'CPS11D-7BA21',        brand: 'EH',   family: 'anly',  name: 'Memosens CPS11D — Sensor de pH digital Memosens',        currency: 'EUR', listPrice: 685.00,  uom: 'UN' },
  { sku: 'CM442-AAM1A1F010A',   brand: 'EH',   family: 'anly',  name: 'Liquiline CM442 — Transmisor multiparámetro 2 canales',  currency: 'EUR', listPrice: 2450.00, uom: 'UN' },
  // WIKA
  { sku: 'A-10-100-G14-MV',     brand: 'WIKA', family: 'pres',  name: 'Transmisor de presión A-10 0-100 bar G1/4" 4-20mA',     currency: 'EUR', listPrice: 285.00,  uom: 'UN' },
  { sku: '232.50.100-0-25',     brand: 'WIKA', family: 'pres',  name: 'Manómetro Bourdon 232.50 DN100 0-25 bar Inox',           currency: 'US$', listPrice: 95.00,   uom: 'UN' },
  { sku: 'TR10-C-DA-A1G',       brand: 'WIKA', family: 'temp',  name: 'Termoresistencia TR10-C Pt100 con cabezal DIN B',        currency: 'EUR', listPrice: 180.00,  uom: 'UN' },
  { sku: 'TC10-B-C4ABAA',       brand: 'WIKA', family: 'temp',  name: 'Termocupla TC10-B tipo K con transmisor integrado',      currency: 'EUR', listPrice: 245.00,  uom: 'UN' },
  { sku: 'DG-10-S-1-100',       brand: 'WIKA', family: 'pres',  name: 'Manómetro digital DG-10-S 0-100 bar IP65',              currency: 'EUR', listPrice: 420.00,  uom: 'UN' },
  // Rotork
  { sku: 'IQ3-25F14A-BA0',      brand: 'ROT',  family: 'valv',  name: 'Actuador eléctrico IQ3 25Nm multivuelta 380VAC',        currency: 'US$', listPrice: 5840.00, uom: 'UN' },
  { sku: 'CVA-L1200-24DC',      brand: 'ROT',  family: 'valv',  name: 'CVA Modulating Actuator 1200N 24VDC',                   currency: 'US$', listPrice: 4280.00, uom: 'UN' },
  { sku: 'AWT-150-DA-BA',       brand: 'ROT',  family: 'valv',  name: 'Actuador neumático AWT 150 doble efecto',               currency: 'US$', listPrice: 1280.00, uom: 'UN' },
  // Valmet
  { sku: 'NELES-X-25-150-DBL',  brand: 'VAL',  family: 'valv',  name: 'Válvula de bola Neles X 2" 150# acero inoxidable',     currency: 'EUR', listPrice: 2150.00, uom: 'UN' },
  { sku: 'ND9000H-PROFIBUS',    brand: 'VAL',  family: 'valv',  name: 'Posicionador inteligente ND9000H Profibus PA',           currency: 'EUR', listPrice: 3680.00, uom: 'UN' },
  // KROHNE
  { sku: 'OPTIFLUX-2300-DN50',  brand: 'KRO',  family: 'flow',  name: 'OPTIFLUX 2300 DN50 — Caudalímetro electromagnético',   currency: 'EUR', listPrice: 3920.00, uom: 'UN' },
  { sku: 'OPTIWAVE-7300-C',     brand: 'KRO',  family: 'level', name: 'OPTIWAVE 7300 C — Radar de nivel sin contacto',         currency: 'EUR', listPrice: 4520.00, uom: 'UN' },
  // Samson
  { sku: '3241-7-VG2-DN50',     brand: 'SAM',  family: 'valv',  name: 'Válvula de control 3241-7 DN50 PN16 con actuador 3271',currency: 'EUR', listPrice: 4280.00, uom: 'UN' },
  { sku: '3730-3-POSITIONER',   brand: 'SAM',  family: 'valv',  name: 'Posicionador 3730-3 HART con diagnóstico EXPERTplus',   currency: 'EUR', listPrice: 1980.00, uom: 'UN' },
  // Emerson
  { sku: 'ROSEMOUNT-3051S-G',   brand: 'EMR',  family: 'pres',  name: 'Rosemount 3051S — Transmisor de presión Coplanar HART',currency: 'US$', listPrice: 2480.00, uom: 'UN' },
  { sku: 'ROSEMOUNT-5408-RADAR',brand: 'EMR',  family: 'level', name: 'Rosemount 5408 — Radar de nivel sin contacto 80GHz',   currency: 'US$', listPrice: 5200.00, uom: 'UN' },
  // AFRISO
  { sku: 'AFRISO-RF12-200',     brand: 'AFR',  family: 'level', name: 'Sensor de nivel capacitivo RF12 L=200mm',              currency: 'EUR', listPrice: 280.00,  uom: 'UN' },
  // Pepperl+Fuchs
  { sku: 'KFD2-STC4-EX1',       brand: 'PEP',  family: 'anly',  name: 'Barrera Ex KFD2-STC4-Ex1 entrada SMART intrínsecamente seg.', currency: 'EUR', listPrice: 320.00, uom: 'UN' },
  // Servicios
  { sku: 'SVC-CAL-FLOW',        brand: 'CRS',  family: 'svc',   name: 'Calibración in-situ de caudalímetro — Anexo X',       currency: 'US$', listPrice: 0, uom: 'SVC', isService: true },
  { sku: 'SVC-COMM-DCS',        brand: 'CRS',  family: 'svc',   name: 'Puesta en marcha y comisionado de lazo DCS — Anexo 1',currency: 'US$', listPrice: 0, uom: 'SVC', isService: true },
  { sku: 'SVC-TRAIN-PLC',       brand: 'CRS',  family: 'svc',   name: 'Capacitación técnica especializada en sitio — Anexo X',currency: 'US$', listPrice: 0, uom: 'SVC', isService: true },
]

export const DEPARTMENTS: Department[] = [
  { id: 'UNAU',      name: 'UNAU',      desc: 'Unidad Automatización Industrial' },
  { id: 'UNAI',      name: 'UNAI',      desc: 'Unidad Análisis e Instrumentación' },
  { id: 'UNVA',      name: 'UNVA',      desc: 'Unidad Válvulas y Actuadores' },
  { id: 'PAU',       name: 'PAU',       desc: 'Productos Auxiliares' },
  { id: 'PIC',       name: 'PIC',       desc: 'Protección Intrínseca / Comunicación' },
  { id: 'Proyectos', name: 'Proyectos', desc: 'Ingeniería y proyectos' },
  { id: 'Servicios', name: 'Servicios', desc: 'Servicios técnicos en sitio' },
  { id: 'QHSE',      name: 'QHSE',      desc: 'Calidad, Salud, Seguridad y Ambiente' },
]

export const HH_TARIFFS: Record<string, Record<string, number>> = {
  normal:        { laboral: 18,   sabado: 27,   domingo: 36 },
  intermedio:    { laboral: 28,   sabado: 42,   domingo: 56 },
  especializado: { laboral: 45,   sabado: 67.5, domingo: 90 },
}

export const SEED_ANNEX = {
  logistica: [
    { id: 'lg1', concepto: 'Pasajes aéreos (2 técnicos)', cant: 2, unidad: 'pax',    costo: 280, notas: 'Económica, ida y vuelta' },
    { id: 'lg2', concepto: 'Movilidad terrestre',          cant: 4, unidad: 'día',   costo: 95,  notas: 'Van + chofer' },
    { id: 'lg3', concepto: 'Hospedaje hotel 3 estrellas',  cant: 8, unidad: 'noche', costo: 85,  notas: '2 hab. x 4 noches' },
    { id: 'lg4', concepto: 'Viáticos alimentación',        cant: 8, unidad: 'día',   costo: 45,  notas: '2 técnicos x 4 días' },
  ],
  subcontratos: [
    { id: 'sc1', concepto: 'Andamiaje certificado',        cant: 1, unidad: 'glb', costo: 850, notas: 'Sub-contrato' },
  ],
  materiales: [
    { id: 'mt1', concepto: 'Kit de calibración patrón',    cant: 1, unidad: 'glb', costo: 320, notas: 'Trazable INACAL' },
    { id: 'mt2', concepto: 'Consumibles diversos',         cant: 1, unidad: 'glb', costo: 180, notas: '' },
  ],
  hh: {
    normal:        { laboral: 16, sabado: 0, domingo: 0 },
    intermedio:    { laboral: 24, sabado: 8, domingo: 0 },
    especializado: { laboral: 12, sabado: 0, domingo: 4 },
  },
  utilidadObjetivo: 28,
}

// Helpers
export const brandById  = (id: string): Brand | undefined  => BRANDS.find(b => b.id === id)
export const familyById = (id: string): Family | undefined => FAMILIES.find(f => f.id === id)
export const skuLookup  = (sku: string): CatalogItem | undefined => CATALOG.find(c => c.sku === sku)
