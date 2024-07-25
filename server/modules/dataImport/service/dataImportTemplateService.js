import { PointFactory, Promises } from '@openforis/arena-core'

import { CsvDataExportModel } from '@common/model/csvExport'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as DateUtils from '@core/dateUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

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
  [NodeDef.nodeDefType.file]: () => uuidv4(),
  [NodeDef.nodeDefType.integer]: () => 123,
  [NodeDef.nodeDefType.taxon]: () => 'TAXON_CODE',
  [NodeDef.nodeDefType.text]: () => 'Text',
  [NodeDef.nodeDefType.time]: () => {
    const now = new Date()
    return DateUtils.formatTime(now.getHours(), now.getMinutes())
  },
}

const extractDataImportTemplate = async ({ survey, cycle, nodeDefUuid, includeFiles }) => {
  const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  const exportModel = new CsvDataExportModel({
    survey,
    cycle,
    nodeDefContext: nodeDef,
    options: {
      includeAnalysis: false,
      includeCategoryItemsLabels: false,
      includeFiles,
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
    nodeDef,
  }
}

const exportDataImportTemplate = async ({ surveyId, cycle, nodeDefUuid, includeFiles, res }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const { template, nodeDef } = await extractDataImportTemplate({ survey, cycle, nodeDefUuid, includeFiles })

  setContentTypeFile({
    res,
    fileName: `data_import_template_${NodeDef.getName(nodeDef)}.csv`,
    contentType: contentTypes.csv,
  })

  await CSVWriter.writeItemsToStream({ outputStream: res, items: [template] })
}

const exportAllDataImportTemplates = async ({ surveyId, cycle, includeFiles, res }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

  const archiver = new ZipArchiver(res)

  setContentTypeFile({
    res,
    fileName: `data_import_templates_${Survey.getName(survey)}.zip`,
    contentType: contentTypes.zip,
  })

  const multipleNodeDefUuids = Survey.findDescendants({
    filterFn: (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef),
  })(survey).map(NodeDef.getUuid)

  const tempFilePaths = []

  await Promises.each(multipleNodeDefUuids, async (nodeDefUuid, idx) => {
    const { template, nodeDef } = await extractDataImportTemplate({ survey, cycle, nodeDefUuid, includeFiles })
    const prefix = `data_import_template_${StringUtils.padStart(2, '0')(String(idx + 1))}`
    const zipEntryName = `${prefix}_${NodeDef.getName(nodeDef)}.csv`
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
