// only Escape: letter shortcuts depend on the keyboard layout (Cyrillic, Mongolian, Japanese...)
export type MapShortcutAction = 'escape'

export type MapShortcutEvent = { key: string }

type EditableCandidate = { tagName?: unknown; type?: unknown; isContentEditable?: unknown }

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

/**
 * Tells whether a key event target is a place where the user types text.
 * @param {EventTarget|null} target - The event target.
 * @returns {boolean} True for text inputs, text areas, selects and content-editable elements.
 */
export const isEditableTarget = (target: EventTarget | EditableCandidate | null): boolean => {
  const element = target as EditableCandidate | null
  if (!element || typeof element.tagName !== 'string') return false
  if (element.isContentEditable === true) return true
  const tagName = element.tagName.toLowerCase()
  if (tagName === 'textarea' || tagName === 'select') return true
  if (tagName !== 'input') return false
  const type = typeof element.type === 'string' ? element.type.toLowerCase() : 'text'
  return !NON_TEXT_INPUT_TYPES.has(type)
}

/**
 * Maps a key press to a map workspace action: Escape outside text fields ends the tool or closes the dialog.
 * @param {MapShortcutEvent} event - The key event.
 * @param {boolean} targetIsEditable - Whether the event target is a text field.
 * @returns {MapShortcutAction|null} The action, or null when the key is not a shortcut.
 */
export const resolveMapShortcut = (event: MapShortcutEvent, targetIsEditable: boolean): MapShortcutAction | null =>
  !targetIsEditable && event.key === 'Escape' ? 'escape' : null
