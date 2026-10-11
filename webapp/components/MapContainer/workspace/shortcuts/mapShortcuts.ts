export type MapShortcutAction =
  'focusSearch' | 'goToCoordinates' | 'measureDistance' | 'measureArea' | 'screenshot' | 'escape'

export type MapShortcutEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

type EditableCandidate = { tagName?: unknown; type?: unknown; isContentEditable?: unknown }

const LETTER_ACTIONS: Record<string, MapShortcutAction> = {
  a: 'measureArea',
  g: 'goToCoordinates',
  m: 'measureDistance',
  s: 'screenshot',
}

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

// labels shown next to menu items and in button tooltips
export const MAP_SHORTCUT_LABELS: Record<Exclude<MapShortcutAction, 'escape'>, string> = {
  focusSearch: 'Ctrl K',
  goToCoordinates: 'G',
  measureArea: 'A',
  measureDistance: 'M',
  screenshot: 'S',
}

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
 * Maps a key press to a map workspace action.
 * Letters only work without modifiers and outside text fields, so typing never starts a tool.
 * @param {MapShortcutEvent} event - The key event.
 * @param {boolean} targetIsEditable - Whether the event target is a text field.
 * @returns {MapShortcutAction|null} The action, or null when the key is not a shortcut.
 */
export const resolveMapShortcut = (event: MapShortcutEvent, targetIsEditable: boolean): MapShortcutAction | null => {
  const key = (event.key ?? '').toLowerCase()
  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key === 'k') return 'focusSearch'
  if (targetIsEditable) return null
  if (key === 'escape') return 'escape'
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return null
  return LETTER_ACTIONS[key] ?? null
}
