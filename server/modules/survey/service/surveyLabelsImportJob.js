import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import Job from '@server/job/job'
import * as CSVReader from '@server/utils/file/csvReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { SurveyLabelsExportModel } from './surveyLabelsExportModel'

const errorPrefix = `validationErrors.surveyLabelsImport.`

const extractLabels = ({ row, langCodes, columnPrefix }) =>
  langCodes.reduce((acc, langCode) => {
    const value = row[`${columnPrefix}${langCode}`]
    const label = StringUtils.trim(value)
    if (StringUtils.isNotBlank(label)) {
      acc[langCode] = label
    }
    return acc
  }, {})

export default class SurveyLabelsImportJob extends Job {
  constructor(params) {
    super(SurveyLabelsImportJob.type, params)
    this.validateHeaders = this.validateHeaders.bind(this)
  }

  async execute() {
    const { context, tx } = this
    const { filePath, surveyId } = context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true }, tx)
    this.setContext({ survey })
    const langCodes = Survey.getLanguages(Survey.getSurveyInfo(survey))

    const nodeDefsUpdated = []

    this.csvReader = CSVReader.createReaderFromFile(
      filePath,
      this.validateHeaders,
      async (row) => {
        const nodeDef = await this.getNodeDef({ survey, row })
        if (!nodeDef) return

        const labels = extractLabels({ langCodes, row, columnPrefix: SurveyLabelsExportModel.labelColumnPrefix })
        const descriptions = extractLabels({
          langCodes,
          row,
          columnPrefix: SurveyLabelsExportModel.descriptionColumnPrefix,
        })

        const nodeDefUpdated = A.pipe(NodeDef.assocLabels(labels), NodeDef.assocDescriptions(descriptions))(nodeDef)
        nodeDefsUpdated.push(nodeDefUpdated)

        this.incrementProcessedItems()
      },
      (total) => (this.total = total)
    )

    await this.csvReader.start()

    if (nodeDefsUpdated.length > 0) {
      await NodeDefManager.updateNodeDefPropsInBatch(
        {
          surveyId,
          nodeDefs: nodeDefsUpdated.map((nodeDefUpdated) => ({
            nodeDefUuid: NodeDef.getUuid(nodeDefUpdated),
            props: NodeDef.getProps(nodeDefUpdated),
          })),
        },
        tx
      )
    }
  }

  async validateHeaders(headers) {
    const { context } = this
    const { survey } = context
    const langCodes = Survey.getLanguages(Survey.getSurveyInfo(survey))

    const fixedHeaders = ['name']
    const dynamicHeaders = []
    langCodes.forEach((langCode) => {
      dynamicHeaders.push(
        SurveyLabelsExportModel.getLabelColumn(langCode),
        SurveyLabelsExportModel.getDescriptionColumn(langCode)
      )
    })
    const validHeaders = [...fixedHeaders, ...dynamicHeaders]
    const invalidHeaders = headers.filter((header) => !validHeaders.includes(header)).join(', ')
    if (invalidHeaders) {
      await this.addErrorAndStopCsvReader('invalidHeaders', { invalidHeaders })
    }
  }

  async getNodeDef({ row }) {
    const { context } = this
    const { survey } = context
    const { name } = row
    let nodeDef = null
    if (name) {
      nodeDef = Survey.getNodeDefByName(name)(survey)
    }
    if (!nodeDef) {
      await this.addErrorAndStopCsvReader('cannotFindNodeDef', { name })
    }
    return nodeDef
  }

  async addErrorAndStopCsvReader(key, params) {
    this.addError({
      error: {
        valid: false,
        errors: [{ key: `${errorPrefix}${key}`, params }],
      },
    })
    this.csvReader.cancel()
    await this.setStatusFailed()
  }
}

SurveyLabelsImportJob.type = 'SurveyLabelsImportJob'
