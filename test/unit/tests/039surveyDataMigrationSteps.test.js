import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import {
  getCurrentAppVersionStamp,
  isSurveyDataMigrationPending,
  latestSurveyDataMigrationVersion,
  surveyDataMigrationSteps,
} from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('surveyDataMigrationSteps', () => {
  it('has exactly two entries', () => {
    expect(surveyDataMigrationSteps).toHaveLength(2)
  })

  it('exposes the latest version as 2.7.2, computed via version comparison', () => {
    expect(latestSurveyDataMigrationVersion).toBe('2.7.2')
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
    expect(isSurveyDataMigrationPending({ appVersion: latestSurveyDataMigrationVersion })).toBe(false)
  })

  it('returns false when the survey app version is newer than the latest migration version', () => {
    expect(isSurveyDataMigrationPending({ appVersion: '99.0.0' })).toBe(false)
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
