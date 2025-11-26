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
    const { archive, surveyId, recordUuids, includeResultAttributes } = this.context

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
      if (!includeResultAttributes) {
        this.clearAnalysisNodeValues({ record: recordData })
      }
      archive.append(JSON.stringify(recordData), {
        name: ExportFile.record({ recordUuid }),
      })
      this.incrementProcessedItems()
    }
  }

  clearAnalysisNodeValues({ record }) {
    const { surveyFull: survey } = this.context
    const nodes = Record.getNodesArray(record)
    for (const node of nodes) {
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      if (NodeDef.isAnalysis(nodeDef)) {
        node[Node.keys.value] = null
      }
    }
  }
}
