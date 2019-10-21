const Job = require('../../../job/job')

const Survey = require('../../../../core/survey/survey')

const SurveyManager = require('../manager/surveyManager')

/**
 * Generates the survey dependency graph and stores it in the metadata of the survey.
 * (It requires the survey to be set in the context or it loads it with "published" props)
 */
class SurveyDependencyGraphsGenerationJob extends Job {

  constructor (params) {
    super(SurveyDependencyGraphsGenerationJob.type, params)
  }

  async execute (tx) {
    //TODO build a new graph for each survey cycle
    const survey = this.contextSurvey || await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, Survey.cycleOneKey, false, true, false, false, tx)

    const graph = Survey.buildDependencyGraph(survey)

    await SurveyManager.updateSurveyDependencyGraphs(this.surveyId, graph, tx)
  }

}

SurveyDependencyGraphsGenerationJob.type = 'SurveyDependencyGraphsGenerationJob'

module.exports = SurveyDependencyGraphsGenerationJob