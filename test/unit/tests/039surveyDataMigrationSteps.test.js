import {
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
