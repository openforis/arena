import { isMobileAppVersionNotSupported } from '@common/mobile'

describe('isMobileAppVersionNotSupported', () => {
  it('accepts versions greater than or equal to the minimum one', () => {
    expect(isMobileAppVersionNotSupported({ appVersion: '2.3.0', minVersion: '2.3.0' })).toBe(false)
    expect(isMobileAppVersionNotSupported({ appVersion: '2.10.1', minVersion: '2.3.0' })).toBe(false)
  })

  it('rejects versions lower than the minimum one', () => {
    expect(isMobileAppVersionNotSupported({ appVersion: '2.2.9', minVersion: '2.3.0' })).toBe(true)
  })

  it('treats a missing or invalid version as unknown (lower than any minimum version except 0.0.0)', () => {
    expect(isMobileAppVersionNotSupported({ appVersion: undefined, minVersion: '2.3.0' })).toBe(true)
    expect(isMobileAppVersionNotSupported({ appVersion: 'abc', minVersion: '2.3.0' })).toBe(true)
    expect(isMobileAppVersionNotSupported({ appVersion: undefined, minVersion: '0.0.0' })).toBe(false)
  })
})
