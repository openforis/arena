import Job from '@server/job/job'
import * as User from '@core/user/user'

import * as RecordManager from '@server/modules/record/manager/recordManager'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as Record from '@core/record/record'

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const { surveyId, arenaSurveyFileZip } = this.context
    
    const records = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)

    const recordsToInsert = await Promise.all(
      records.map(async (record) => ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, Record.getUuid(record)))
    )

    if (recordsToInsert.length <= 0) return
    await RecordManager.insertRecordsInBatch(
      {
        user: this.user,
        surveyId,
        records: recordsToInsert,
        userUuid: User.getUuid(this.user),
      },
      this.tx
    )

    const nodesToInsert = []
    recordsToInsert.forEach((record) => {
      const nodes = Record.getNodes(record)

      Object.values(nodes || {}).forEach((node) => {
        nodesToInsert.push(node)
      })
    })

    if (nodesToInsert.length <= 0) return
    await RecordManager.insertNodesInBatch({ surveyId, nodeValues: nodesToInsert }, this.tx)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
