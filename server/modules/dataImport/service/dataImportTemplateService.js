import { PointFactory, Points } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'

import * as CSVWriter from '@server/utils/file/csvWriter'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const valuesByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: () => true,
  [NodeDef.nodeDefType.code]: () => 'CATEGORY_CODE',
  [NodeDef.nodeDefType.coordinate]: () =>
    Points.toString(PointFactory.createInstance({ srs: 'EPSG:4326', x: 41.8830209, y: 12.4879562 })),
  [NodeDef.nodeDefType.date]: () => DateUtils.formatDateISO(new Date()),
  [NodeDef.nodeDefType.decimal]: () => 123.45,
  [NodeDef.nodeDefType.file]: () => {
    throw new Error('File attribute import not supported')
  },
  [NodeDef.nodeDefType.integer]: () => 123,
  [NodeDef.nodeDefType.taxon]: () => 'TAXON_CODE',
  [NodeDef.nodeDefType.text]: () => 'Text',
  [NodeDef.nodeDefType.time]: () => {
    const now = new Date()
    return DateUtils.formatTime(now.getHours(), now.getMinutes())
  },
}

const extractDataImportTemplate = async ({ surveyId, cycle, entityDefUuid }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const exportModel = new CsvDataExportModel({
    survey,
    nodeDefContext: entityDef,
    options: {
      includeAnalysis: false,
      includeCategoryItemsLabels: false,
      includeFiles: false,
      includeReadOnlyAttributes: false,
      includeTaxonScientificName: false,
    },
  })
  return exportModel.columns.reduce((acc, column) => {
    const { header, nodeDef, valueProp } = column
    const value = nodeDef ? valuesByNodeDefType[NodeDef.getType(nodeDef)]({ valueProp }) : ''
    return { ...acc, [header]: value }
  }, {})
}

const writeDataImportTemplateToStream = async ({ surveyId, cycle, entityDefUuid, outputStream }) => {
  const dataImportTemplate = await extractDataImportTemplate({ surveyId, cycle, entityDefUuid })
  await CSVWriter.writeItemsToStream(outputStream, [dataImportTemplate])
}

export const DataImportTemplateService = {
  writeDataImportTemplateToStream,
}
