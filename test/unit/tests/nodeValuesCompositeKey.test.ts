import { NodeValues } from '@core/record/nodeValues'

const { buildCompositeKey: buildBucketKey } = NodeValues as { buildCompositeKey: (keyParts: string[]) => string }

describe('NodeValues.buildCompositeKey', () => {
  it('is stable and deterministic for the same key parts', () => {
    expect(buildBucketKey(['A', 'B'])).toBe(buildBucketKey(['A', 'B']))
  })

  it('produces different keys for different key parts (no separator involved)', () => {
    expect(buildBucketKey(['A', 'B'])).not.toBe(buildBucketKey(['A', 'C']))
  })

  it('does not collide when a key part contains the internal separator character', () => {
    // \u0001 is a typical separator character: without escaping, ["A\u0001B", "C"] and
    // ["A", "B\u0001C"] would join to the exact same string and be treated as the same record.
    const keyPartsA = ['A\u0001B', 'C']
    const keyPartsB = ['A', 'B\u0001C']
    expect(buildBucketKey(keyPartsA)).not.toBe(buildBucketKey(keyPartsB))
  })

  it('does not collide when a key part is made entirely of separator characters', () => {
    const keyPartsA = ['\u0001\u0001', 'X']
    const keyPartsB = ['\u0001', '\u0001X']
    expect(buildBucketKey(keyPartsA)).not.toBe(buildBucketKey(keyPartsB))
  })

  it('is symmetric for a single key part regardless of separator content', () => {
    expect(buildBucketKey(['A\u0001B'])).toBe(buildBucketKey(['A\u0001B']))
  })
})
