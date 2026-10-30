import { Versions } from '@openforis/arena-core'

import * as ProcessUtils from '@core/processUtils'
import {
  getCurrentAppVersionStamp,
  isSurveyDataMigrationPending,
  latestSurveyDataMigrationVersion,
  surveyDataMigrationSteps,
} from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('surveyDataMigrationSteps', () => {
  it('has exactly six entries', () => {
    expect(surveyDataMigrationSteps).toHaveLength(6)
  })

  it('exposes the latest version as 2.10.9, computed via version comparison', () => {
    expect(latestSurveyDataMigrationVersion).toBe('2.10.9')
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

  describe('with APP_VERSION set', () => {
    const { applicationVersion } = ProcessUtils.ENV

    afterEach(() => {
      ProcessUtils.ENV.applicationVersion = applicationVersion
    })

    it.each([
      [undefined, latestSurveyDataMigrationVersion],
      ['not-a-version', latestSurveyDataMigrationVersion],
      ['2.3.0', latestSurveyDataMigrationVersion],
      ['2.10.8-1-ge54d9dd88', latestSurveyDataMigrationVersion], // build between two releases
      ['99.0.0', '99.0.0'],
    ])('stamps %s as %s', (version, expected) => {
      ProcessUtils.ENV.applicationVersion = version
      expect(getCurrentAppVersionStamp()).toBe(expected)
      expect(isSurveyDataMigrationPending({ appVersion: getCurrentAppVersionStamp() })).toBe(false)
    })
  })
})
