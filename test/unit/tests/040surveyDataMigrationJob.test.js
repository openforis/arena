import { getPendingSurveyDataMigrationSteps } from '@server/modules/survey/service/dataMigration/surveyDataMigrationJob'
import { getSurveysToMigrate } from '@server/modules/survey/service/dataMigration/allSurveysDataMigrationJob'
import { latestSurveyDataMigrationVersion } from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('getPendingSurveyDataMigrationSteps', () => {
  it('returns all steps when the survey has no stored app version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: null })
    expect(steps).toHaveLength(1)
    expect(steps[0].version).toBe(latestSurveyDataMigrationVersion)
  })

  it('returns all steps when the survey app version is older than every step', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '1.0.0' })
    expect(steps).toHaveLength(1)
  })

  it('returns no steps when the survey app version is already at the latest migration version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: latestSurveyDataMigrationVersion })
    expect(steps).toHaveLength(0)
  })

  it('returns no steps when the survey app version is newer than the latest migration version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '99.0.0' })
    expect(steps).toHaveLength(0)
  })
})

describe('getSurveysToMigrate', () => {
  it('treats a missing/null app version as older than any migration version', () => {
    const surveys = [
      { id: 1, appVersion: null },
      { id: 2, appVersion: undefined },
    ]
    const surveysToMigrate = getSurveysToMigrate(surveys)
    expect(surveysToMigrate.map(({ id }) => id)).toEqual([1, 2])
  })

  it('excludes surveys already at or above the latest migration version', () => {
    const surveys = [
      { id: 1, appVersion: '1.0.0' },
      { id: 2, appVersion: latestSurveyDataMigrationVersion },
      { id: 3, appVersion: '99.0.0' },
    ]
    const surveysToMigrate = getSurveysToMigrate(surveys)
    expect(surveysToMigrate.map(({ id }) => id)).toEqual([1])
  })

  it('returns an empty array when every survey is up to date', () => {
    const surveys = [{ id: 1, appVersion: latestSurveyDataMigrationVersion }]
    expect(getSurveysToMigrate(surveys)).toEqual([])
  })

  it('uses the same predicate as isSurveyDataMigrationPending, so an unparseable stored app version fails safe (included, not thrown)', () => {
    const surveys = [{ id: 1, appVersion: 'not-a-version' }]
    expect(() => getSurveysToMigrate(surveys)).not.toThrow()
    expect(getSurveysToMigrate(surveys).map(({ id }) => id)).toEqual([1])
  })
})
