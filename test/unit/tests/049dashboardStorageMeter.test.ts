import { themeColors } from '@webapp/theme/tokens'
import { getStorageUsageFillColor } from '@webapp/views/Dashboard/StorageSummary/StorageUsageMeter'

describe('getStorageUsageFillColor', () => {
  it('returns success below the warn threshold', () => {
    expect(getStorageUsageFillColor(0)).toBe(themeColors.success)
    expect(getStorageUsageFillColor(69)).toBe(themeColors.success)
  })

  it('returns warning from warn up to critical', () => {
    expect(getStorageUsageFillColor(70)).toBe(themeColors.warning)
    expect(getStorageUsageFillColor(84)).toBe(themeColors.warning)
  })

  it('returns error at and above critical', () => {
    expect(getStorageUsageFillColor(85)).toBe(themeColors.error)
    expect(getStorageUsageFillColor(100)).toBe(themeColors.error)
  })
})
