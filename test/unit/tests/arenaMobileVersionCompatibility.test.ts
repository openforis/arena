import {
  getMinRequiredArenaMobileVersion,
  checkArenaMobileVersionSupported,
} from '@server/modules/mobile/service/arenaMobileDataImport/arenaMobileVersionCompatibility'

const rules = [
  { sinceArenaVersion: '2.8.0', minArenaMobileVersion: '2.8.0' },
  { sinceArenaVersion: '3.0.0', minArenaMobileVersion: '3.0.0' },
]

const buildInfo = ({ appId = 'arena-mobile', version }: { appId?: string; version?: string }): any => ({
  appInfo: { appId, version },
})

describe('arenaMobileVersionCompatibility', () => {
  describe('getMinRequiredArenaMobileVersion', () => {
    test('returns null when no rule applies yet (the default, empty rule set)', () => {
      expect(getMinRequiredArenaMobileVersion('2.8.0', [])).toBeNull()
    })

    test('returns null when the running arena version is below every rule', () => {
      expect(getMinRequiredArenaMobileVersion('2.7.0', rules)).toBeNull()
    })

    test('returns the min version of the highest applicable rule', () => {
      expect(getMinRequiredArenaMobileVersion('2.8.5', rules)).toBe('2.8.0')
      expect(getMinRequiredArenaMobileVersion('3.1.0', rules)).toBe('3.0.0')
    })
  })

  describe('checkArenaMobileVersionSupported', () => {
    test('does nothing when the file was not created by arena-mobile', () => {
      expect(() =>
        checkArenaMobileVersionSupported(
          { info: buildInfo({ appId: 'arena', version: '1.0.0' }) },
          { arenaVersion: '3.0.0', rules }
        )
      ).not.toThrow()
    })

    test('does nothing when no rule applies to the running arena version', () => {
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: '1.0.0' }) }, { arenaVersion: '2.7.0', rules })
      ).not.toThrow()
    })

    test('does nothing when the arena-mobile version meets the required minimum', () => {
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: '2.8.0' }) }, { arenaVersion: '2.8.5', rules })
      ).not.toThrow()
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: '2.9.3' }) }, { arenaVersion: '2.8.5', rules })
      ).not.toThrow()
    })

    test('throws when the arena-mobile version is below the required minimum', () => {
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: '2.7.0' }) }, { arenaVersion: '2.8.5', rules })
      ).toThrow('dataImport.arenaMobileVersionNotSupported')
    })

    test('throws when the file has no version at all and a rule applies', () => {
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: undefined }) }, { arenaVersion: '2.8.5', rules })
      ).toThrow('dataImport.arenaMobileVersionNotSupported')
    })

    test('throws when the arena-mobile version cannot be parsed, instead of crashing', () => {
      expect(() =>
        checkArenaMobileVersionSupported(
          { info: buildInfo({ version: 'not-a-version' }) },
          { arenaVersion: '2.8.5', rules }
        )
      ).toThrow('dataImport.arenaMobileVersionNotSupported')
    })

    test('accepts a "v"-prefixed arena-mobile version', () => {
      expect(() =>
        checkArenaMobileVersionSupported({ info: buildInfo({ version: 'v2.8.0' }) }, { arenaVersion: '2.8.5', rules })
      ).not.toThrow()
    })

    test('includes the offending and required versions in the thrown error params', () => {
      let caughtError: any = null
      try {
        checkArenaMobileVersionSupported({ info: buildInfo({ version: '2.7.0' }) }, { arenaVersion: '2.8.5', rules })
      } catch (error) {
        caughtError = error
      }
      expect(caughtError?.params).toEqual({ arenaMobileVersion: '2.7.0', minArenaMobileVersion: '2.8.0' })
    })
  })
})
