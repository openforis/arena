const R = require('ramda')

const Job = require('@server/job/job')

const Survey = require('@core/survey/survey')
const NodeDef = require('@core/survey/nodeDef')
const Validation = require('@core/validation/validation')

const SurveyManager = require('../../../../survey/manager/surveyManager')

class NodeDefsValidationJob extends Job {

  constructor (params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)
    for (const cycle of cycleKeys) {
      const surveyAndNodeDefs = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(this.surveyId, cycle, true, true, true, false, tx)

      R.pipe(
        Survey.getNodeDefsValidation,
        Validation.getFieldValidations,
        R.forEachObjIndexed((nodeDefValidation, nodeDefUuid) => {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(surveyAndNodeDefs)
          this.errors[NodeDef.getName(nodeDef)] = Validation.getFieldValidations(nodeDefValidation)
        })
      )(surveyAndNodeDefs)
    }
    if (!R.isEmpty(this.errors)) {
      await this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'

module.exports = NodeDefsValidationJob