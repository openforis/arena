import { isEditableTarget, resolveMapShortcut } from '@webapp/components/MapContainer/workspace/shortcuts/mapShortcuts'

const key = (value: string) => ({ key: value })

describe('Map keyboard shortcuts (254)', () => {
  test('a keydown without a key (browser autofill) is not a shortcut', () => {
    expect(resolveMapShortcut({ key: undefined } as unknown as ReturnType<typeof key>, false)).toBeNull()
  })

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

  test('letters are not shortcuts: they depend on the keyboard layout', () => {
    for (const letter of ['m', 'a', 's', 'g', 'k']) {
      expect(resolveMapShortcut(key(letter), false)).toBeNull()
    }
  })

  test('Escape outside text fields only', () => {
    expect(resolveMapShortcut(key('Escape'), false)).toBe('escape')
    expect(resolveMapShortcut(key('Escape'), true)).toBeNull()
  })
})
