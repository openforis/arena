import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'

export default class NodeDefsImportJob extends Job {
  constructor(params) {
    super(NodeDefsImportJob.type, params)
  }

  async execute() {
    const { arenaSurvey, backup, surveyId } = this.context

    const nodeDefs = Survey.getNodeDefs(arenaSurvey)

    await NodeDefManager.insertNodeDefsBatch({
      surveyId,
      nodeDefs: Object.values(nodeDefs || {}),
      backup,
      client: this.tx,
    })
  }
}

NodeDefsImportJob.type = 'NodeDefsImportJob'
