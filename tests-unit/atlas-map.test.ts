import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'
import {MAP_REGIONS, MAP_VIEWBOX} from '../web/lib/atlasMap'

const csv = readFileSync(new URL('../scripts/map/subregions.csv', import.meta.url), 'utf8').trim().split('\n').slice(1)
const SUBREGION_IDS = csv.map((line) => line.split(',')[0])

describe('mapa Atlasu (29 subregionów, geometria generowana z ISTAT)', () => {
  it('ma wszystkie subregiony z subregions.csv, w tej samej kolejności', () => {
    expect(SUBREGION_IDS).toHaveLength(29)
    expect(MAP_REGIONS.map((r) => r.id)).toEqual(SUBREGION_IDS)
  })

  it('id są unikalne i zgodne z listą mapId w Studio', () => {
    const ids = MAP_REGIONS.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    const studio = readFileSync(new URL('../studio/schemaTypes/place.ts', import.meta.url), 'utf8')
    const values = [...studio.matchAll(/value: '([^']+)'/g)].map((m) => m[1]).filter((v) => ids.includes(v))
    expect(values).toEqual(ids)
  })

  it('każdy subregion ma niepustą, zamkniętą ścieżkę i punkt etykiety w viewBox', () => {
    const [, , w, h] = MAP_VIEWBOX.split(' ').map(Number)
    for (const u of MAP_REGIONS) {
      expect(u.d.startsWith('M')).toBe(true)
      expect(u.d.endsWith('Z')).toBe(true)
      expect(u.at[0]).toBeGreaterThan(0)
      expect(u.at[0]).toBeLessThan(w)
      expect(u.at[1]).toBeGreaterThan(0)
      expect(u.at[1]).toBeLessThan(h)
      if (u.lines) expect(u.lines.join(' ').replace(/- /g, '-')).toBe(u.short)
    }
  })
})
