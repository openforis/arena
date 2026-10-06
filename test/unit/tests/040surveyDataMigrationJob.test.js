import { getPendingSurveyDataMigrationSteps } from '@server/modules/survey/service/dataMigration/surveyDataMigrationJob'
import { getSurveysToMigrate } from '@server/modules/survey/service/dataMigration/allSurveysDataMigrationJob'
import { latestSurveyDataMigrationVersion } from '@server/modules/survey/service/dataMigration/surveyDataMigrationSteps'

describe('getPendingSurveyDataMigrationSteps', () => {
  const currentAppVersion = latestSurveyDataMigrationVersion

  it('returns all steps when the survey has no stored app version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: null, currentAppVersion })
    expect(steps).toHaveLength(5)
    expect(steps.map((step) => step.version)).toEqual(['2.3.20', '2.7.2', '2.8.3', '2.8.5', '2.9.8'])
  })

  it('returns all steps when the survey app version is older than every step', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '1.0.0', currentAppVersion })
    expect(steps).toHaveLength(5)
  })

  it('returns no steps when the survey app version is already at the latest migration version', () => {
    const steps = getPendingSurveyDataMigrationSteps({
      surveyAppVersion: latestSurveyDataMigrationVersion,
      currentAppVersion,
    })
    expect(steps).toHaveLength(0)
  })

  it('returns no steps when the survey app version is newer than the latest migration version', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '99.0.0', currentAppVersion })
    expect(steps).toHaveLength(0)
  })

  it('does not return the 2.9.8 step (survey schema migrations) while the app version is 2.9.7', () => {
    expect(getPendingSurveyDataMigrationSteps({ surveyAppVersion: '2.8.5', currentAppVersion: '2.9.7' })).toEqual([])
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '2.8.3', currentAppVersion: '2.9.7' })
    expect(steps.map((step) => step.version)).toEqual(['2.8.5'])
  })

  it('returns the 2.9.8 step once the app version is 2.9.8', () => {
    const steps = getPendingSurveyDataMigrationSteps({ surveyAppVersion: '2.9.7', currentAppVersion: '2.9.8' })
    expect(steps.map((step) => step.version)).toEqual(['2.9.8'])
  })
})

describe('getSurveysToMigrate', () => {
  it('does not select surveys migrated up to 2.8.5 while the app version is 2.9.7 (no survey schema migrations are run)', () => {
    const surveys = [
      { id: 1, appVersion: '2.8.5' },
      { id: 2, appVersion: '2.9.6' },
      { id: 3, appVersion: '2.9.7' },
      { id: 4, appVersion: '2.8.4' },
    ]
    expect(getSurveysToMigrate(surveys, '2.9.7').map(({ id }) => id)).toEqual([4])
  })

  it('selects the surveys behind 2.9.8 once the app version is 2.9.8', () => {
    const surveys = [
      { id: 1, appVersion: '2.8.5' },
      { id: 2, appVersion: '2.9.7' },
      { id: 3, appVersion: '2.9.8' },
    ]
    expect(getSurveysToMigrate(surveys, '2.9.8').map(({ id }) => id)).toEqual([1, 2])
  })

  it('treats a missing/null app version as older than any migration version', () => {
    const surveys = [
      { id: 1, appVersion: null },
      { id: 2, appVersion: undefined },
    ]
    const surveysToMigrate = getSurveysToMigrate(surveys, latestSurveyDataMigrationVersion)
    expect(surveysToMigrate.map(({ id }) => id)).toEqual([1, 2])
  })

  it('excludes surveys already at or above the latest migration version', () => {
    const surveys = [
      { id: 1, appVersion: '1.0.0' },
      { id: 2, appVersion: latestSurveyDataMigrationVersion },
      { id: 3, appVersion: '99.0.0' },
    ]
    const surveysToMigrate = getSurveysToMigrate(surveys, latestSurveyDataMigrationVersion)
    expect(surveysToMigrate.map(({ id }) => id)).toEqual([1])
  })

  it('returns an empty array when every survey is up to date', () => {
    const surveys = [{ id: 1, appVersion: latestSurveyDataMigrationVersion }]
    expect(getSurveysToMigrate(surveys, latestSurveyDataMigrationVersion)).toEqual([])
  })

  it('uses the same predicate as isSurveyDataMigrationPending, so an unparseable stored app version fails safe (included, not thrown)', () => {
    const surveys = [{ id: 1, appVersion: 'not-a-version' }]
    expect(() => getSurveysToMigrate(surveys)).not.toThrow()
    expect(getSurveysToMigrate(surveys).map(({ id }) => id)).toEqual([1])
  })
})
