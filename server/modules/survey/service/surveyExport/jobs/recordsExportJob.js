import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import Job from '@server/job/job'
import * as RecordService from '@server/modules/record/service/recordService'
import { ExportFile } from '../exportFile'

export default class RecordsExportJob extends Job {
  constructor(params) {
    super('RecordsExportJob', params)
  }

  async execute() {
    const { archive, surveyId, recordUuids, includeAnalysis } = this.context

    const records = await RecordService.fetchRecordsUuidAndCycle({ surveyId, recordUuidsIncluded: recordUuids })
    archive.append(JSON.stringify(records, null, 2), { name: ExportFile.records })

    this.total = records.length

    for (const record of records) {
      if (this.isCanceled()) break

      const recordUuid = Record.getUuid(record)
      const recordData = await RecordService.fetchRecordAndNodesByUuid({
        surveyId,
        recordUuid,
        fetchForUpdate: false,
        includeRefData: false,
        includeSurveyUuid: false,
        includeRecordUuid: false,
      })
      if (!includeAnalysis) {
        this.deleteAnalysisNodes({ record: recordData })
      }
      archive.append(JSON.stringify(recordData, null, 2), {
        name: ExportFile.record({ recordUuid }),
      })
      this.incrementProcessedItems()
    }
  }

  deleteAnalysisNodes({ record }) {
    const { surveyFull: survey } = this.context
    const nodes = Record.getNodes(record)
    for (const node of Object.values(nodes)) {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      if (NodeDef.isAnalysis(nodeDef)) {
        delete nodes[Node.getUuid(node)]
      }
    }
  }
}
