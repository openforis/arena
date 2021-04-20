import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '../manager/surveyManager'

/**
 * Generates the survey dependency graph and stores it in the metadata of the survey.
 * (It requires the survey to be set in the context or it loads it with "published" props)
 */
export default class SurveyDependencyGraphsGenerationJob extends Job {
  constructor(params) {
    super(SurveyDependencyGraphsGenerationJob.type, params)
  }

  async execute() {
    // TODO build a new graph for each survey cycle
    const survey =
      this.contextSurvey ||
      (await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId: this.surveyId, cycle: Survey.cycleOneKey, advanced: true },
        this.tx
      ))

    const graph = Survey.buildDependencyGraph(survey)

    await SurveyManager.updateSurveyDependencyGraphs(this.surveyId, graph, this.tx)
  }
}

SurveyDependencyGraphsGenerationJob.type = 'SurveyDependencyGraphsGenerationJob'
