import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import {
  getApplicableSurveyDataMigrationSteps,
  getCurrentAppVersionStamp,
  isSurveyDataMigrationPending,
  latestSurveyDataMigrationVersion,
  surveyDataMigrationSteps,
} from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('surveyDataMigrationSteps', () => {
  it('has exactly five entries', () => {
    expect(surveyDataMigrationSteps).toHaveLength(5)
  })

  it('exposes the latest registered version as 2.9.8, computed via version comparison', () => {
    expect(latestSurveyDataMigrationVersion).toBe('2.9.8')
  })
})

describe('getApplicableSurveyDataMigrationSteps', () => {
  const versionsOf = (currentAppVersion) =>
    getApplicableSurveyDataMigrationSteps(currentAppVersion).map((step) => step.version)

  it('does not include the 2.9.8 step (survey schema migrations) while the app version is lower than 2.9.8', () => {
    expect(versionsOf('2.9.7')).toEqual(['2.3.20', '2.7.2', '2.8.3', '2.8.5'])
  })

  it('uses the version of a build made after a tag (git describe format) as the base version', () => {
    expect(versionsOf('2.9.7-3-g1a2b3c4')).toEqual(['2.3.20', '2.7.2', '2.8.3', '2.8.5'])
  })

  it('includes the 2.9.8 step when the app version is 2.9.8 or higher', () => {
    const all = ['2.3.20', '2.7.2', '2.8.3', '2.8.5', '2.9.8']
    expect(versionsOf('2.9.8')).toEqual(all)
    expect(versionsOf('2.10.0')).toEqual(all)
  })

  it('uses the version of the running app by default', () => {
    expect(getApplicableSurveyDataMigrationSteps()).toEqual(
      getApplicableSurveyDataMigrationSteps(getCurrentAppVersionStamp())
    )
  })
})

describe('isSurveyDataMigrationPending', () => {
  it('returns true when the survey has no stored app version', () => {
    expect(isSurveyDataMigrationPending({ appVersion: null })).toBe(true)
  })

  it('returns true when the survey has an undefined app version', () => {
    expect(isSurveyDataMigrationPending({ appVersion: undefined })).toBe(true)
  })

  it('returns true when the survey app version is older than the latest migration version', () => {
    expect(isSurveyDataMigrationPending({ appVersion: '1.0.0' })).toBe(true)
  })

  it('returns false when the survey app version equals the latest migration version', () => {
    const currentAppVersion = latestSurveyDataMigrationVersion
    expect(isSurveyDataMigrationPending({ appVersion: latestSurveyDataMigrationVersion, currentAppVersion })).toBe(
      false
    )
  })

  it('returns false when the survey app version is newer than the latest migration version', () => {
    expect(isSurveyDataMigrationPending({ appVersion: '99.0.0' })).toBe(false)
  })

  describe('steps registered for a future app version', () => {
    it('are not pending while the app version is 2.9.7: surveys already migrated up to 2.8.5 are not selected nor blocked', () => {
      const currentAppVersion = '2.9.7'
      expect(isSurveyDataMigrationPending({ appVersion: '2.8.5', currentAppVersion })).toBe(false)
      expect(isSurveyDataMigrationPending({ appVersion: '2.9.6', currentAppVersion })).toBe(false)
      expect(isSurveyDataMigrationPending({ appVersion: '2.9.7', currentAppVersion })).toBe(false)
    })

    it('do not hide the steps that are applicable: older surveys are still pending in 2.9.7', () => {
      const currentAppVersion = '2.9.7'
      expect(isSurveyDataMigrationPending({ appVersion: '2.8.4', currentAppVersion })).toBe(true)
      expect(isSurveyDataMigrationPending({ appVersion: null, currentAppVersion })).toBe(true)
    })

    it('become pending once the app version reaches 2.9.8', () => {
      const currentAppVersion = '2.9.8'
      expect(isSurveyDataMigrationPending({ appVersion: '2.8.5', currentAppVersion })).toBe(true)
      expect(isSurveyDataMigrationPending({ appVersion: '2.9.7', currentAppVersion })).toBe(true)
      expect(isSurveyDataMigrationPending({ appVersion: '2.9.8', currentAppVersion })).toBe(false)
    })
  })

  it('does not throw and fails safe (treats as pending) when the stored app version is not a parseable version string', () => {
    expect(() => isSurveyDataMigrationPending({ appVersion: 'not-a-version' })).not.toThrow()
    expect(isSurveyDataMigrationPending({ appVersion: 'not-a-version' })).toBe(true)
  })

  it('fails safe for a bare, tagless commit hash (e.g. from `git describe --always` with no tags)', () => {
    expect(isSurveyDataMigrationPending({ appVersion: '207bc95f8' })).toBe(true)
  })
})

describe('getCurrentAppVersionStamp', () => {
  it('always returns a value that Versions.parse can parse without throwing', () => {
    expect(() => Versions.parse(getCurrentAppVersionStamp())).not.toThrow()
  })

  it('returns ProcessUtils.ENV.applicationVersion when set and parseable, otherwise falls back to latestSurveyDataMigrationVersion', () => {
    // whether APP_VERSION is set depends on the running environment (e.g. it's loaded from the repo's .env
    // as a side effect of requiring @openforis/arena-server's db module); compute the expected value either way.
    const { applicationVersion } = ProcessUtils.ENV
    const expected = applicationVersion || latestSurveyDataMigrationVersion
    expect(getCurrentAppVersionStamp()).toBe(expected)
  })
})
