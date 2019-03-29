const R = require('ramda')

const Job = require('../../../../../job/job')

const NodeDef = require('../../../../../../common/survey/nodeDef')
const Validator = require('../../../../../../common/validation/validator')

const NodeDefManager = require('../../../../nodeDef/persistence/nodeDefManager')

class NodeDefsValidationJob extends Job {

  constructor (params) {
    super(NodeDefsValidationJob.type, params)
  }

  async execute (tx) {
    const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(this.getSurveyId(), true, true, true, tx)

    const nodeDefsInvalid = R.pipe(
      R.values,
      R.reject(nodeDef => Validator.isValid(nodeDef))
    )(nodeDefs)

    if (!R.isEmpty(nodeDefsInvalid)) {
      this.errors = R.reduce(
        (acc, nodeDef) => R.assoc(NodeDef.getName(nodeDef), Validator.getInvalidFieldValidations(nodeDef.validation), acc),
        {},
        nodeDefsInvalid
      )
      this.setStatusFailed()
    }
  }
}

NodeDefsValidationJob.type = 'NodeDefsValidationJob'

module.exports = NodeDefsValidationJob