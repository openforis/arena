const R = require('ramda')

const Job = require('../../job/job')

const NodeDef = require('../../../common/survey/nodeDef')
const {isValid, getInvalidFieldValidations} = require('../../../common/validation/validator')

const NodeDefManager = require('../../nodeDef/nodeDefManager')

class NodeDefsValidationJob extends Job {

  constructor (params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute (tx) {
    const validatedNodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(this.surveyId, true, true, tx)

    const invalidNodeDefs = R.filter(nodeDef => !isValid(nodeDef), validatedNodeDefs)

    if (!R.isEmpty(invalidNodeDefs)) {
      this.errors = R.reduce((acc, nodeDef) => R.assoc(NodeDef.getNodeDefName(nodeDef), getInvalidFieldValidations(nodeDef.validation), acc), {}, invalidNodeDefs)
      this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'

module.exports = NodeDefsValidationJob