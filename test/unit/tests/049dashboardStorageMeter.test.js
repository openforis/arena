import { getStorageUsageFillColor } from '@webapp/views/App/views/Dashboard/StorageSummary/StorageUsageMeter'
import { defaultTokens } from '@webapp/theme/tokens'

describe('getStorageUsageFillColor', () => {
  it('returns green below the warn threshold', () => {
    expect(getStorageUsageFillColor(0)).toBe(defaultTokens.colors.green)
    expect(getStorageUsageFillColor(69)).toBe(defaultTokens.colors.green)
  })

  it('returns orange from warn up to critical', () => {
    expect(getStorageUsageFillColor(70)).toBe(defaultTokens.colors.orange)
    expect(getStorageUsageFillColor(84)).toBe(defaultTokens.colors.orange)
  })

  it('returns red at and above critical', () => {
    expect(getStorageUsageFillColor(85)).toBe(defaultTokens.colors.red)
    expect(getStorageUsageFillColor(100)).toBe(defaultTokens.colors.red)
  })
})
