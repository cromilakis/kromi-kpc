import { describe, it, expect } from 'vitest'
import es from '../messages/es.json'
import {
  AGENCIES,
  COMPLEMENTARY_DOMAINS,
  CYCLE_PHASES,
  DOSSIER_DOCS,
  FOOTER_COLUMNS,
  NAV_LINKS,
  PRICING_TIERS,
  PRINCIPLE_DOMAINS,
  STAKES,
  SUPPORT_ITEMS,
} from '../components/landing/data'
import { whatsappUrl } from '../components/landing/whatsapp'

// Acceso dinámico al catálogo (las claves vienen de data.ts).
const asRecord = (value: unknown) => value as Record<string, unknown>

describe('smoke', () => {
  it('el entorno de test corre', () => {
    expect(true).toBe(true)
  })
})

describe('landing i18n — el catálogo cubre la data estructurada', () => {
  it('los 14 dominios tienen nombre y descripción en es.json', () => {
    const items = asRecord(es.landing.domains.items)
    const domains = [...PRINCIPLE_DOMAINS, ...COMPLEMENTARY_DOMAINS]
    expect(domains).toHaveLength(14)
    for (const domain of domains) {
      const entry = asRecord(items[domain.key])
      expect(entry, `dominio ${domain.code}`).toBeDefined()
      expect(entry.name).toBeTruthy()
      expect(entry.description).toBeTruthy()
    }
  })

  it('sanciones, fases, expediente, acompañamiento y agencias tienen textos', () => {
    for (const stake of STAKES) {
      expect(asRecord(es.landing.stakes.items)[stake.key]).toBeDefined()
    }
    for (const phase of CYCLE_PHASES) {
      expect(asRecord(es.landing.cycle.phases)[phase]).toBeDefined()
    }
    for (const doc of DOSSIER_DOCS) {
      expect(asRecord(es.landing.deliverable.dossier.docs)[doc]).toBeTruthy()
    }
    for (const item of SUPPORT_ITEMS) {
      expect(asRecord(es.landing.support.items)[item]).toBeDefined()
    }
    for (const agency of AGENCIES) {
      expect(asRecord(es.landing.agencies.items)[agency]).toBeTruthy()
    }
    for (const link of NAV_LINKS) {
      expect(asRecord(es.landing.nav)[link.key]).toBeTruthy()
    }
    for (const tier of PRICING_TIERS) {
      expect(asRecord(es.landing.pricing.tiers)[tier.key]).toBeDefined()
    }
  })

  it('el footer tiene columnas completas y el acceso discreto al panel', () => {
    for (const column of FOOTER_COLUMNS) {
      const col = asRecord(asRecord(es.landing.footer.columns)[column.key])
      expect(col).toBeDefined()
      const links = asRecord(col.links)
      for (const link of column.links) {
        expect(links[link.key], `link ${column.key}.${link.key}`).toBeTruthy()
      }
    }
    const panelLink = FOOTER_COLUMNS.flatMap((c) => c.links).find(
      (l) => l.key === 'consultantPanel',
    )
    expect(panelLink?.href).toBe('/login')
  })

  it('el expediente usa la nomenclatura ARCOP del RFC (no ARSOP)', () => {
    expect(es.landing.deliverable.dossier.docs.arcop).toContain('ARCOP')
    expect(JSON.stringify(es.landing)).not.toContain('ARSOP')
  })

  it('whatsappUrl arma el enlace wa.me con el mensaje codificado', () => {
    const url = whatsappUrl('Hola, quiero información')
    expect(url).toMatch(/^https:\/\/wa\.me\/\d+\?text=/)
    expect(url).toContain(encodeURIComponent('Hola, quiero información'))
  })
})
