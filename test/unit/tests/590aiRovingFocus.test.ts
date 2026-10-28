import { getRovingTargetIndex } from '@webapp/components/ai/hooks/useRovingFocus'

describe('roving focus (590)', () => {
  test('arrow keys move one item and stop at the first and last item', () => {
    expect(getRovingTargetIndex({ key: 'ArrowRight', current: 1, count: 4 })).toBe(2)
    expect(getRovingTargetIndex({ key: 'ArrowDown', current: 1, count: 4 })).toBe(2)
    expect(getRovingTargetIndex({ key: 'ArrowLeft', current: 1, count: 4 })).toBe(0)
    expect(getRovingTargetIndex({ key: 'ArrowUp', current: 1, count: 4 })).toBe(0)
    expect(getRovingTargetIndex({ key: 'ArrowLeft', current: 0, count: 4 })).toBe(0)
    expect(getRovingTargetIndex({ key: 'ArrowRight', current: 3, count: 4 })).toBe(3)
  })

  test('other keys are not handled', () => {
    expect(getRovingTargetIndex({ key: 'Enter', current: 1, count: 4 })).toBeNull()
    expect(getRovingTargetIndex({ key: 'Tab', current: 1, count: 4 })).toBeNull()
  })
})
