const Job = require('../../../../../job/job')

const Survey = require('../../../../../../common/survey/survey')

const SurveyManager = require('../../../manager/surveyManager')

class SurveyDependencyGraphsGenerationJob extends Job {

  constructor (params) {
    super(SurveyDependencyGraphsGenerationJob.type, params)
  }

  async execute (tx) {
    const surveyId = this.getSurveyId()
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, false, true, false, tx)
    const graph = Survey.buildDependencyGraph(survey)

    await SurveyManager.updateSurveyDependencyGraphs(surveyId, graph, tx)
  }
}

SurveyDependencyGraphsGenerationJob.type = 'SurveyDependencyGraphsGenerationJob'

module.exports = SurveyDependencyGraphsGenerationJob