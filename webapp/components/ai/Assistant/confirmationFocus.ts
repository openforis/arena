/**
 * Where the focus goes when a confirmation opens and closes (pure; the elements are anything with focus()).
 */
export type Focusable = { focus: () => void }
export type FocusRoot = { querySelector: (selector: string) => Focusable | null }

export const FIRST_ENABLED_BUTTON = 'button:not(:disabled)'

export type ConfirmationFocus = {
  // the control that opens the confirmation
  remember: (opener: Focusable | null) => void
  // the confirmation is shown: its first button gets the focus
  enter: (root: FocusRoot | null) => void
  // cancelled: the focus goes back to the control that opened it
  cancel: () => void
  // applied or sent to the review: the focus goes to `next` (the result line of the card after Apply), or where the
  // action sends it when there is none (the review dialog takes it)
  close: (next?: Focusable | null) => void
}

/**
 * Creates the focus handoff of one confirmation.
 * @returns {ConfirmationFocus} The handoff.
 */
export const createConfirmationFocus = (): ConfirmationFocus => {
  let opener: Focusable | null = null
  return {
    remember: (from) => {
      opener = from
    },
    enter: (root) => {
      root?.querySelector(FIRST_ENABLED_BUTTON)?.focus()
    },
    cancel: () => {
      opener?.focus()
      opener = null
    },
    close: (next) => {
      opener = null
      next?.focus()
    },
  }
}
