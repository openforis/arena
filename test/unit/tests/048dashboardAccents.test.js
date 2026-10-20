import { themeColors } from '@webapp/theme/tokens'
import { getDashboardAccent, withAlpha } from '@webapp/views/App/views/Dashboard/theme/dashboardAccents'

describe('withAlpha', () => {
  it('mixes the color with transparent using alpha 0–1', () => {
    expect(withAlpha('#3885ca', 0.12)).toBe('color-mix(in srgb, #3885ca 12%, transparent)')
  })

  it('supports CSS variables and clamps alpha', () => {
    expect(withAlpha('var(--color-primary)', 2)).toBe('color-mix(in srgb, var(--color-primary) 100%, transparent)')
  })
})

describe('getDashboardAccent', () => {
  it('maps records to primary', () => {
    expect(getDashboardAccent('records').color).toBe(themeColors.primary)
  })

  it('maps contributors to success', () => {
    expect(getDashboardAccent('contributors').color).toBe(themeColors.success)
  })

  it('maps storage to warning', () => {
    expect(getDashboardAccent('storage').color).toBe(themeColors.warning)
  })

  it('exposes an Icon component for each kind', () => {
    for (const kind of ['records', 'contributors', 'storage']) {
      expect(typeof getDashboardAccent(kind).Icon).toBe('object')
    }
  })
})
