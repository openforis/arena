const Job = require('../../../../../job/job')

const NodeDefManager = require('../../../../nodeDef/manager/nodeDefManager')

class NodeDefWithoutCyclesDeleteJob extends Job {

  constructor (params) {
    super(NodeDefWithoutCyclesDeleteJob.type, params)
  }

  async execute (tx) {
    await NodeDefManager.markNodeDefsWithoutCyclesDeleted(this.surveyId, this.tx)
  }

}

NodeDefWithoutCyclesDeleteJob.type = 'NodeDefWithoutCyclesDeleteJob'

module.exports = NodeDefWithoutCyclesDeleteJob