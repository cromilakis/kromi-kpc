/**
 * Data estructurada de la landing (códigos y claves i18n) — los textos viven
 * en messages/es.json bajo el namespace "landing" (regla i18n del proyecto).
 * Fuente: design/prototype.dc.html (sección isLanding) + prototype-analysis.md §5.
 */

/** Dominio del marco KPC: clave i18n (landing.domains.items) + código canónico. */
export interface DomainRef {
  key: string;
  code: string;
}

/** 8 dominios alineados a los principios del Art. 3, Ley 21.719. */
export const PRINCIPLE_DOMAINS: DomainRef[] = [
  { key: "lic", code: "KPC-LIC" },
  { key: "fin", code: "KPC-FIN" },
  { key: "pro", code: "KPC-PRO" },
  { key: "cal", code: "KPC-CAL" },
  { key: "res", code: "KPC-RES" },
  { key: "seg", code: "KPC-SEG" },
  { key: "tra", code: "KPC-TRA" },
  { key: "con", code: "KPC-CON" },
];

/** 6 dominios complementarios (obligaciones operativas). */
export const COMPLEMENTARY_DOMAINS: DomainRef[] = [
  { key: "inv", code: "KPC-INV" },
  { key: "der", code: "KPC-DER" },
  { key: "sen", code: "KPC-SEN" },
  { key: "ter", code: "KPC-TER" },
  { key: "inc", code: "KPC-INC" },
  { key: "eia", code: "KPC-EIA" },
];

/**
 * Sanciones de la Ley 21.719 (banda "Lo que está en juego").
 * `level` (1→3) alimenta el medidor monocromo de barras ascendentes que
 * comunica la escala de gravedad por cantidad/altura (no por color), de la
 * menos a la más grave.
 */
export interface StakeRef {
  key: string;
  level: number; // 1..3
}

export const STAKES: StakeRef[] = [
  { key: "minor", level: 1 },
  { key: "serious", level: 2 },
  { key: "severe", level: 3 },
];

/** Ciclo de servicio: 3 pasos (landing.cycle.phases). */
export const CYCLE_PHASES = ["evaluate", "diagnosis", "implement"] as const;

/** Componentes del entregable ("El Informe", landing.report.items). */
export const REPORT_ITEMS = [
  "exposure",
  "breaches",
  "legal",
  "plan",
  "evidence",
  "pdf",
] as const;

/**
 * Cards del acompañamiento (landing.fork.pathB.items): las 4 formas de apoyo en
 * la implementación, ahora dentro del camino B de la bifurcación.
 */
export const SUPPORT_ITEMS = [
  "assigned",
  "advisory",
  "implementation",
  "followUp",
] as const;

/** Wordmarks del ecosistema regulatorio (landing.agencies.items). */
export const AGENCIES = [
  "apdp",
  "anci",
  "sernac",
  "cmf",
  "dt",
  "subtel",
] as const;

/**
 * Anchors de la navegación de la landing (landing.nav). Orden narrativo
 * (positioning.md §7): el informe (protagonista) → estándar → proceso, con el
 * CTA único "Obtén tu informe gratis" siempre visible. El contexto legal
 * (#riesgo) queda fuera del nav: es contexto, no gancho.
 */
export const NAV_LINKS = [
  { key: "report", href: "#informe" },
  { key: "domains", href: "#dominios" },
  { key: "cycle", href: "#ciclo" },
  { key: "resources", href: "/recursos" },
] as const;

/**
 * Columnas del footer (landing.footer.columns) como sitemap real: anchors de
 * sección existentes (#dominios, #ciclo, #certificacion, #riesgo), páginas
 * reales (/self-assessment, /login → acceso discreto del consultor, RFC §11) y
 * los textos oficiales de las leyes. Se retiraron (2026-07-21) las entradas sin
 * destino del prototipo para no mostrar arquitectura de información vacía.
 */
export interface FooterColumnRef {
  key: string;
  links: { key: string; href?: string; external?: boolean }[];
}

/** Textos oficiales en Ley Chile (BCN), verificados por idNorma. */
const LEYCHILE = "https://www.bcn.cl/leychile/navegar?idNorma=";

export const FOOTER_COLUMNS: FooterColumnRef[] = [
  {
    key: "framework",
    links: [
      { key: "report", href: "#informe" },
      { key: "domains", href: "#dominios" },
      { key: "cycle", href: "#ciclo" },
    ],
  },
  {
    key: "platform",
    links: [
      { key: "selfAssessment", href: "/self-assessment" },
      { key: "risk", href: "#riesgo" },
      { key: "resources", href: "/recursos" },
    ],
  },
  {
    key: "legal",
    links: [
      { key: "law21719", href: `${LEYCHILE}1209272`, external: true },
      { key: "law21663", href: `${LEYCHILE}1202434`, external: true },
      { key: "law19496", href: `${LEYCHILE}61438`, external: true },
      { key: "laborCode", href: `${LEYCHILE}207436`, external: true },
    ],
  },
];

/**
 * Preguntas frecuentes (landing.faq.items). Cierran objeciones del usuario no
 * técnico antes de la sección de precios. Nota: "obligation" hace una afirmación
 * legal — su redacción requiere validación con el abogado.
 */
export const FAQ_ITEMS = [
  "obligation",
  "duration",
  "cost",
  "skills",
  "deliverable",
  "whyFree",
  "privacy",
] as const;
