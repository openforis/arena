/**
 * When the reasons a control is blocked show below it for keyboard users (pure). Hover users get a tooltip instead,
 * and never both at once.
 */
export type ReasonsState = {
  // the control (or the reasons) has the focus because of the keyboard
  keyboardFocus: boolean
  // Escape closed the reasons: they stay closed until the focus leaves
  dismissed: boolean
}

export type ReasonsEvent =
  | { type: 'focus'; keyboard: boolean }
  // toInside: the focus moves between the control and the reasons
  | { type: 'blur'; toInside: boolean }
  | { type: 'escape' }

export const initialReasonsState: ReasonsState = { keyboardFocus: false, dismissed: false }

/**
 * Returns the next state.
 * @param {ReasonsState} state - Current state.
 * @param {ReasonsEvent} event - What happened.
 * @returns {ReasonsState} The next state.
 */
export const reduceReasons = (state: ReasonsState, event: ReasonsEvent): ReasonsState => {
  switch (event.type) {
    case 'focus':
      return event.keyboard && !state.keyboardFocus ? { ...state, keyboardFocus: true } : state
    case 'blur':
      return event.toInside ? state : initialReasonsState
    case 'escape':
      return { ...state, dismissed: true }
    default:
      return state
  }
}

/**
 * Tells whether the reasons are open below the control.
 * @param {ReasonsState} state - Current state.
 * @returns {boolean} True when they show.
 */
export const isReasonsPopupOpen = ({ keyboardFocus, dismissed }: ReasonsState): boolean => keyboardFocus && !dismissed
