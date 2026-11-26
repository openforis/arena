import { iconComponents } from '@webapp/components/MaterialIcon/iconComponents'

describe('Material icon components', () => {
  test('every icon name maps to a Material icon component', () => {
    for (const [name, component] of Object.entries(iconComponents)) {
      expect({ name, defined: Boolean(component) }).toEqual({ name, defined: true })
    }
  })
})
