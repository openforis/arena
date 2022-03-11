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
    await this.fetchSurveyAndRecordsSummary()

    await this.startCsvReader()
  }

  async fetchSurveyAndRecordsSummary() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    // fetch survey
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: false, advanced: true },
      tx
    )

    // fetch all records summary once to make the record fetch faster
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
  }

  async startCsvReader() {
    const { entityDefUuid, filePath, survey } = this.context

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

  async getOrFetchRecord({ valuesByDefUuid }) {
    const { recordsSummary, survey } = this.context

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
      const recordUuid = Record.getUuid(recordSummary)
      if (this.currentRecord?.uuid === recordUuid) {
        // avoid loading the same record multiple times
      } else {
        if (this.currentRecord) {
          // record changed, SAVE changes to record
        }
        this.currentRecord = await RecordManager.fetchRecordAndNodesByUuid(
          { surveyId: this.surveyId, recordUuid, draft: false },
          this.tx
        )
      }
    } else {
      throw new Error(`Record not found`)
    }
    return this.currentRecord
  }

  async onRowItem({ valuesByDefUuid }) {
    const { survey, entityDefUuid, updateExistingRecords } = this.context

    const record = await this.getOrFetchRecord({ valuesByDefUuid })

    if (updateExistingRecords) {
      const { record: recordUpdated, nodesUpdatedToPersist } = Record.updateAttributesWithValues({
        survey,
        entityDefUuid,
        valuesByDefUuid,
      })(record)

      this.currentRecord = recordUpdated

      if (!recordUpdated || !nodesUpdatedToPersist) {
        throw new Error('error updating record')
      }
    }

    this.incrementProcessedItems()
  }
}

DataImportJob.type = 'DataImportJob'
