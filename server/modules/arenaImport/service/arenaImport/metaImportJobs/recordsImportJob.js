import Job from '@server/job/job'

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

    await RecordManager.insertRecordsInBatch({ user: this.user, surveyId, records: recordsToInsert })

    const nodesToInsert = []
    recordsToInsert.forEach((record) => {
      const nodes = Record.getNodes(record)

      Object.values(nodes || {}).forEach((node) => {
        nodesToInsert.push(node)
      })
    })

    await RecordManager.insertNodesInBatch(surveyId, nodesToInsert)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
