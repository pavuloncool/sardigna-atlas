import {describe, expect, it} from 'vitest'
import {effectiveType} from '../web/lib/partnership'

describe('effectiveType', () => {
  it('bez współpracy i bez afiliacji → none', () => {
    expect(effectiveType(null, false)).toBe('none')
    expect(effectiveType({type: 'none'}, false)).toBe('none')
  })
  it('afiliacja wykrywana automatycznie', () => {
    expect(effectiveType(null, true)).toBe('affiliate')
    expect(effectiveType({type: 'none'}, true)).toBe('affiliate')
  })
  it('silniejsze oznaczenie wygrywa z afiliacją', () => {
    expect(effectiveType({type: 'gifted'}, true)).toBe('gifted')
    expect(effectiveType({type: 'collaboration'}, true)).toBe('collaboration')
    expect(effectiveType({type: 'sponsored'}, true)).toBe('sponsored')
  })
  it('afiliacja nie zniża jawnej współpracy', () => {
    expect(effectiveType({type: 'affiliate'}, false)).toBe('affiliate')
    expect(effectiveType({type: 'sponsored'}, false)).toBe('sponsored')
  })
})
