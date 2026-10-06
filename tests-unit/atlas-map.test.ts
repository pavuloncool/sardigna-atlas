import {describe, expect, it} from 'vitest'
import {MAP_OTHERS, MAP_REGIONS, MAP_UNITS, MAP_VIEWBOX} from '../web/lib/atlasMap'

const REGION_IDS = ['nurra', 'gallura', 'logudoro', 'oristano', 'baronia', 'barbagia', 'ogliastra', 'campidano', 'sulcis', 'sarrabus']

describe('mapa Atlasu (geometria generowana z ISTAT)', () => {
  it('ma dokładnie 10 regionów o ustalonych mapId, w stałej kolejności', () => {
    expect(MAP_REGIONS.map((r) => r.id)).toEqual(REGION_IDS)
  })

  it('id jednostek są unikalne, a „inne krainy” nie kolidują z regionami', () => {
    const ids = MAP_UNITS.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(MAP_OTHERS.map((u) => u.name)).toEqual(
      expect.arrayContaining(['Romangia', 'Marmilla', 'Trexenta', 'Parteolla', 'Gerrei', 'Sarcidano', 'Arburese-Guspinese']),
    )
  })

  it('każda jednostka ma niepustą, zamkniętą ścieżkę i etykietę w viewBox', () => {
    const [, , w, h] = (MAP_VIEWBOX).split(' ').map(Number)
    for (const u of MAP_UNITS) {
      expect(u.d.startsWith('M')).toBe(true)
      expect(u.d.endsWith('Z')).toBe(true)
      expect(u.label[0]).toBeGreaterThan(0)
      expect(u.label[0]).toBeLessThan(w)
      expect(u.label[1]).toBeGreaterThan(0)
      expect(u.label[1]).toBeLessThan(h)
    }
  })
})

