import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import { NodeValues } from '@core/record/nodeValues'
import * as FileUtils from '@server/utils/file/fileUtils'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { DataImportFileReader } from './dataImportFileReader'
import { CsvExportModel } from '@common/model/csvExport'

export default class DataImportJob extends Job {
  constructor(params) {
    super(DataImportJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const { cycle, entityDefUuid, filePath, updateExistingRecords } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: false, advanced: true },
      tx
    )

    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId({
      surveyId,
      cycle,
      offset: 0,
      limit: null,
    })

    this.setContext({
      survey,
      recordsSummary: recordsSummary.list,
    })

    const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
    const csvDataExportModel = new CsvExportModel({
      survey,
      nodeDefContext: entityDef,
      options: {
        includeCategoryItemsLabels: false,
        includeTaxonScientificName: false,
        includeFiles: false,
        includeAnalysis: false,
      },
    })

    const stream = FileUtils.createReadStream(filePath)

    const reader = await DataImportFileReader.createReader({
      stream,
      survey,
      csvDataExportModel,
      onRowItem: (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
    })

    await reader.start()
  }

  async onRowItem({ valuesByDefUuid }) {
    const { recordsSummary, survey, entityDefUuid } = this.context

    // find record
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
    const recordSummary = recordsSummary.find((record) =>
      rootKeyDefs.every((rootKeyDef) => {
        const keyValueInRecord = record[A.camelize(NodeDef.getName(rootKeyDef))]
        const keyValueInRow = valuesByDefUuid[NodeDef.getUuid(rootKeyDef)]
        return NodeValues.isValueEqual({
          survey,
          nodeDef: rootKeyDef,
          value: keyValueInRecord,
          valueSearch: keyValueInRow,
        })
      })
    )
    if (recordSummary) {
      // find parent node
      const record = await RecordManager.fetchRecordAndNodesByUuid(
        { surveyId: this.surveyId, recordUuid: Record.getUuid(recordSummary), draft: false },
        this.tx
      )
      const { record: recordUpdated, nodesUpdatedToPersist } = Record.updateNodesWithValues({
        survey,
        parentDefUuid: entityDefUuid,
        valuesByDefUuid,
      })(record)

      
    } else {
      // TODO error record not found
    }
    this.incrementProcessedItems()
  }
}

DataImportJob.type = 'DataImportJob'
