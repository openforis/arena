import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

export default class NodeDefsImportJob extends Job {
  constructor(params) {
    super(NodeDefsImportJob.type, params)
  }

  async execute() {
    const { arenaSurvey, backup, surveyId } = this.context

    const nodeDefs = Survey.getNodeDefsArray(arenaSurvey)

    await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs, backup, client: this.tx })
  }
}

NodeDefsImportJob.type = 'NodeDefsImportJob'
