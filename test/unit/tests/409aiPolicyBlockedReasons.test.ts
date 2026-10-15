import {
  initialReasonsState,
  isReasonsPopupOpen,
  reduceReasons,
} from '@webapp/components/ai/AiPolicyBlockedTooltip/reasonsPopupModel'

describe('blocked-feature reasons for the keyboard (409)', () => {
  test('keyboard focus opens the reasons, a click does not', () => {
    expect(isReasonsPopupOpen(reduceReasons(initialReasonsState, { type: 'focus', keyboard: true }))).toBe(true)
    expect(isReasonsPopupOpen(reduceReasons(initialReasonsState, { type: 'focus', keyboard: false }))).toBe(false)
  })

  test('Escape closes them, and the focus coming back to the control does not reopen them', () => {
    let state = reduceReasons(initialReasonsState, { type: 'focus', keyboard: true })
    state = reduceReasons(state, { type: 'escape' })
    expect(isReasonsPopupOpen(state)).toBe(false)
    state = reduceReasons(state, { type: 'focus', keyboard: true })
    expect(isReasonsPopupOpen(state)).toBe(false)
  })

  test('leaving the control and its reasons resets, so the next keyboard focus opens them again', () => {
    let state = reduceReasons(initialReasonsState, { type: 'focus', keyboard: true })
    state = reduceReasons(state, { type: 'escape' })
    state = reduceReasons(state, { type: 'blur', toInside: false })
    expect(state).toEqual(initialReasonsState)
    expect(isReasonsPopupOpen(reduceReasons(state, { type: 'focus', keyboard: true }))).toBe(true)
  })

  test('moving the focus between the control and the actions in the reasons keeps them open', () => {
    const open = reduceReasons(initialReasonsState, { type: 'focus', keyboard: true })
    expect(isReasonsPopupOpen(reduceReasons(open, { type: 'blur', toInside: true }))).toBe(true)
  })
})
