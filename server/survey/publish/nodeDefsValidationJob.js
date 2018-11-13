const R = require('ramda')

const {Job} = require('../../job/job')

const NodeDef = require('../../../common/survey/nodeDef')
const {isValid, getInvalidFieldValidations} = require('../../../common/validation/validator')

const {validateNodeDefs} = require('../../nodeDef/nodeDefValidator')
const NodeDefRepository = require('../../nodeDef/nodeDefRepository')

class NodeDefsValidationJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'node definitions validation')
  }

  async execute () {
    const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(this.surveyId, true)

    const validatedNodeDefs = await validateNodeDefs(nodeDefsDB)
    const invalidNodeDefs = R.filter(nodeDef => !isValid(nodeDef), validatedNodeDefs)

    if (R.isEmpty(invalidNodeDefs)) {
      this.setStatusSucceeded()
    } else {
      this.errors = R.reduce((acc, nodeDef) => R.assoc(NodeDef.getNodeDefName(nodeDef), getInvalidFieldValidations(nodeDef.validation), acc), {}, invalidNodeDefs)
      this.setStatusFailed()
    }
  }
}

module.exports = NodeDefsValidationJob