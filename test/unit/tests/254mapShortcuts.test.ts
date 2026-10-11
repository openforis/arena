import {
  isEditableTarget,
  MAP_SHORTCUT_LABELS,
  resolveMapShortcut,
} from '@webapp/components/MapContainer/workspace/shortcuts/mapShortcuts'

type Modifiers = Partial<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }>

const key = (value: string, modifiers: Modifiers = {}) => ({
  key: value,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  ...modifiers,
})

describe('Map keyboard shortcuts (254)', () => {
  test('isEditableTarget recognises text fields only', () => {
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget({})).toBe(false)
    expect(isEditableTarget({ tagName: 'DIV' })).toBe(false)
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true)
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true)
    expect(isEditableTarget({ tagName: 'SELECT' })).toBe(true)
    expect(isEditableTarget({ tagName: 'INPUT' })).toBe(true)
    expect(isEditableTarget({ tagName: 'INPUT', type: 'search' })).toBe(true)
    expect(isEditableTarget({ tagName: 'INPUT', type: 'checkbox' })).toBe(false)
    expect(isEditableTarget({ tagName: 'INPUT', type: 'RANGE' })).toBe(false)
    expect(isEditableTarget({ tagName: 'BUTTON' })).toBe(false)
  })

  test('letters map to tools outside text fields', () => {
    expect(resolveMapShortcut(key('m'), false)).toBe('measureDistance')
    expect(resolveMapShortcut(key('M'), false)).toBe('measureDistance') // caps lock
    expect(resolveMapShortcut(key('a'), false)).toBe('measureArea')
    expect(resolveMapShortcut(key('s'), false)).toBe('screenshot')
    expect(resolveMapShortcut(key('g'), false)).toBe('goToCoordinates')
    expect(resolveMapShortcut(key('x'), false)).toBeNull()
  })

  test('letters with modifiers are not shortcuts', () => {
    expect(resolveMapShortcut(key('M', { shiftKey: true }), false)).toBeNull()
    expect(resolveMapShortcut(key('m', { ctrlKey: true }), false)).toBeNull()
    expect(resolveMapShortcut(key('m', { altKey: true }), false)).toBeNull()
    expect(resolveMapShortcut(key('s', { metaKey: true }), false)).toBeNull()
  })

  test('typing in a text field never triggers a tool', () => {
    for (const letter of ['m', 'a', 's', 'g']) {
      expect(resolveMapShortcut(key(letter), true)).toBeNull()
    }
    expect(resolveMapShortcut(key('Escape'), true)).toBeNull()
  })

  test('Ctrl/Cmd+K focuses the search box, also from a text field', () => {
    expect(resolveMapShortcut(key('k', { ctrlKey: true }), false)).toBe('focusSearch')
    expect(resolveMapShortcut(key('k', { metaKey: true }), true)).toBe('focusSearch')
    expect(resolveMapShortcut(key('K', { ctrlKey: true, shiftKey: true }), false)).toBeNull()
    expect(resolveMapShortcut(key('k', { ctrlKey: true, altKey: true }), false)).toBeNull()
    expect(resolveMapShortcut(key('k'), false)).toBeNull()
  })

  test('Escape outside text fields', () => {
    expect(resolveMapShortcut(key('Escape'), false)).toBe('escape')
  })

  test('labels shown in menus and tooltips', () => {
    expect(MAP_SHORTCUT_LABELS).toEqual({
      focusSearch: 'Ctrl K',
      goToCoordinates: 'G',
      measureArea: 'A',
      measureDistance: 'M',
      screenshot: 'S',
    })
  })
})
