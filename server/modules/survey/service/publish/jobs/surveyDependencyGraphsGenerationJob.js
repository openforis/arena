const Job = require('../../../../../job/job')

const SurveyManager = require('../../../persistence/surveyManager')

const SurveyDependencyGraph = require('../../../surveyDependenchyGraph')

class SurveyDependencyGraphsGenerationJob extends Job {

  constructor (params) {
    super(SurveyDependencyGraphsGenerationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.getSurveyId(), false, true, false, tx)
    const graph = SurveyDependencyGraph.buildGraph(survey)

    await SurveyManager.updateSurveyDependencyGraphs(this.getSurveyId(), graph, tx)
  }
}

SurveyDependencyGraphsGenerationJob.type = 'SurveyDependencyGraphsGenerationJob'

module.exports = SurveyDependencyGraphsGenerationJob