import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

import * as PromiseUtils from '@core/promiseUtils'

export default class NodeDefsImportJob extends Job {
  constructor(params) {
    super(NodeDefsImportJob.type, params)
  }

  async execute() {
    const { arenaSurvey, surveyId } = this.context

    const nodeDefs = Survey.getNodeDefs(arenaSurvey)

    await PromiseUtils.each(Object.values(nodeDefs || {}), async (nodeDef) =>
      NodeDefManager.insertNodeDef({ user: this.user, surveyId, nodeDef, addLogs: false })
    )
  }
}

NodeDefsImportJob.type = 'NodeDefsImportJob'
