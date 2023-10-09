import { PointFactory, Promises } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'

import { contentTypes, setContentTypeFile } from '@server/utils/response'
import * as CSVWriter from '@server/utils/file/csvWriter'
import * as FileUtils from '@server/utils/file/fileUtils'
import { ZipArchiver } from '@server/utils/file/zipArchiver'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const valuesByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: () => true,
  [NodeDef.nodeDefType.code]: () => 'CATEGORY_CODE',
  [NodeDef.nodeDefType.coordinate]: ({ valueProp }) => {
    const coordinate = PointFactory.createInstance({ x: 41.8830209, y: 12.4879562 })
    return coordinate[valueProp]
  },
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

const extractDataImportTemplate = async ({ survey, cycle, entityDefUuid }) => {
  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const exportModel = new CsvDataExportModel({
    survey,
    cycle,
    nodeDefContext: entityDef,
    options: {
      includeAnalysis: false,
      includeCategoryItemsLabels: false,
      includeFiles: false,
      includeReadOnlyAttributes: false,
      includeTaxonScientificName: false,
    },
  })
  const template = exportModel.columns.reduce((acc, column) => {
    const { header, nodeDef, valueProp } = column
    const value = nodeDef ? valuesByNodeDefType[NodeDef.getType(nodeDef)]({ valueProp }) : ''
    return { ...acc, [header]: value }
  }, {})

  return {
    template,
    entityDef,
  }
}

const exportDataImportTemplate = async ({ surveyId, cycle, entityDefUuid, res }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const { template, entityDef } = await extractDataImportTemplate({ survey, cycle, entityDefUuid })

  setContentTypeFile({
    res,
    fileName: `data_import_template_${NodeDef.getName(entityDef)}.csv`,
    contentType: contentTypes.csv,
  })

  await CSVWriter.writeItemsToStream({ outputStream: res, items: [template] })
}

const exportAllDataImportTemplates = async ({ surveyId, cycle, res }) => {
  setContentTypeFile({
    res,
    fileName: `data_import_templates.zip`,
    contentType: contentTypes.zip,
  })

  const archiver = new ZipArchiver(res)

  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const multipleEntityDefUuids = []

  Survey.traverseMultipleEntityDefs((nodeDef) => {
    multipleEntityDefUuids.push(NodeDef.getUuid(nodeDef))
  })(survey)

  const tempFilePaths = []

  await Promises.each(multipleEntityDefUuids, async (entityDefUuid) => {
    const { template, entityDef } = await extractDataImportTemplate({ survey, cycle, entityDefUuid })
    const zipEntryName = `data_import_template_${NodeDef.getName(entityDef)}.csv`
    const tempFilePath = FileUtils.newTempFilePath()

    await CSVWriter.writeItemsToStream({ outputStream: FileUtils.createWriteStream(tempFilePath), items: [template] })

    archiver.addFile(tempFilePath, zipEntryName)
    tempFilePaths.push(tempFilePath)
  })

  await archiver.finalize()

  // delete temp files
  await Promise.all(tempFilePaths.map(FileUtils.deleteFileAsync))
}

export const DataImportTemplateService = {
  exportDataImportTemplate,
  exportAllDataImportTemplates,
}
