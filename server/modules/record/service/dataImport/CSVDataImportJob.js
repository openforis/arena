import * as A from '@core/arena'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as FileUtils from '@server/utils/file/fileUtils'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { createCSVDataImportReaderFromStream } from './CSVDataImportFileReader'
import { CsvExportModel } from '@common/model/csvExport'

export default class CSVDataImportJob extends Job {
  constructor(params) {
    super(CSVDataImportJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const { cycle, entityDefUuid, filePath } = this.context

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
      options: { includeCategoryItemsLabels: false, includeTaxonScientificName: false, includeFiles: false },
    })

    const stream = FileUtils.createReadStream(filePath)

    const reader = await createCSVDataImportReaderFromStream({
      stream,
      csvDataExportModel,
      onRowItem: (item) => this.onRowItem(item),
      onTotalChange: (total) => (this.total = total),
    })

    await reader.start()
  }

  async onRowItem({ ancestorsKeyValuesByAncestorDefUuid, valuesByAttributeDefUuid }) {
    const { recordsSummary, survey } = this.context

    const rootDef = Survey.getNodeDefRoot(survey)
    const rootKeyDefs = Survey.getNodeDefRootKeys(survey)
    const rootKeyValuesByNodeDefUuid = ancestorsKeyValuesByAncestorDefUuid[NodeDef.getUuid(rootDef)]
    const recordSummary = recordsSummary.find((record) =>
      rootKeyDefs.every((rootKeyDef) => {
        const keyValueInRecord = record[A.camelize(NodeDef.getName(rootKeyDef))]
        const keyValueInRow = rootKeyValuesByNodeDefUuid[NodeDef.getUuid(rootKeyDef)]
        return keyValueInRecord === keyValueInRow
      })
    )
    if (recordSummary) {
    } else {
      // TODO error record not found
    }
  }
}

CSVDataImportJob.type = 'CSVDataImportJob'
