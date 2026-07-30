import {
  isSurveyDataMigrationPending,
  latestSurveyDataMigrationVersion,
  surveyDataMigrationSteps,
} from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('surveyDataMigrationSteps', () => {
  it('has exactly one entry', () => {
    expect(surveyDataMigrationSteps).toHaveLength(1)
  })

  it('exposes the latest version as 2.5.6', () => {
    expect(latestSurveyDataMigrationVersion).toBe('2.5.6')
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
})
