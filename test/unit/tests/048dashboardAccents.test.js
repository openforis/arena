import { defaultTokens } from '@webapp/theme/tokens'
import {
  getDashboardAccent,
  withAlpha,
} from '@webapp/views/App/views/Dashboard/theme/dashboardAccents'

describe('withAlpha', () => {
  it('appends AA from alpha 0–1 on a 7-char hex', () => {
    expect(withAlpha('#3885ca', 0.12)).toBe('#3885ca1f')
  })
})

describe('getDashboardAccent', () => {
  it('maps records to blue', () => {
    expect(getDashboardAccent('records').color).toBe(defaultTokens.colors.blue)
  })

  it('maps contributors to green', () => {
    expect(getDashboardAccent('contributors').color).toBe(defaultTokens.colors.green)
  })

  it('maps storage to orange', () => {
    expect(getDashboardAccent('storage').color).toBe(defaultTokens.colors.orange)
  })

  it('exposes an Icon component for each kind', () => {
    for (const kind of ['records', 'contributors', 'storage']) {
      expect(typeof getDashboardAccent(kind).Icon).toBe('object')
    }
  })
})
