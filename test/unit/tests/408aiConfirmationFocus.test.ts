import { createConfirmationFocus, type Focusable } from '@webapp/components/ai/Assistant/confirmationFocus'

const focusable = (name: string, log: string[]): Focusable => ({ focus: () => log.push(name) })

const rootWith = (first: Focusable | null) => ({ querySelector: jest.fn(() => first) })

describe('confirmation focus (408)', () => {
  test('opening moves the focus to the first button of the confirmation', () => {
    const log: string[] = []
    const handoff = createConfirmationFocus()
    const root = rootWith(focusable('review', log))
    handoff.remember(focusable('applyAll', log))
    handoff.enter(root)
    expect(root.querySelector).toHaveBeenCalledWith('button:not(:disabled)')
    expect(log).toEqual(['review'])
  })

  test('cancelling returns the focus to Apply all, once', () => {
    const log: string[] = []
    const handoff = createConfirmationFocus()
    handoff.remember(focusable('applyAll', log))
    handoff.enter(rootWith(focusable('review', log)))
    handoff.cancel()
    handoff.cancel()
    expect(log).toEqual(['review', 'applyAll'])
  })

  test('applying or reviewing lets the focus go where the action sends it', () => {
    const log: string[] = []
    const handoff = createConfirmationFocus()
    handoff.remember(focusable('applyAll', log))
    handoff.enter(rootWith(focusable('review', log)))
    handoff.close()
    handoff.cancel()
    expect(log).toEqual(['review'])
  })

  test('a confirmation without buttons or an opener does not fail', () => {
    const handoff = createConfirmationFocus()
    expect(() => {
      handoff.enter(rootWith(null))
      handoff.enter(null)
      handoff.cancel()
    }).not.toThrow()
  })
})
