import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import Job from '@server/job/job'
import * as CSVReader from '@server/utils/file/csvReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { Arrays } from '@openforis/arena-core'

const errorPrefix = `validationErrors.surveyLabelsImport.`
const getLabelColumn = (langCode) => `label_${langCode}`
const getDescriptionColumn = (langCode) => `description_${langCode}`

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

        const labels = langCodes.reduce((acc, langCode) => {
          const label = row[getLabelColumn(langCode)]
          acc[langCode] = label
          return acc
        }, {})

        const descriptions = langCodes.reduce((acc, langCode) => {
          const description = row[getDescriptionColumn(langCode)]
          acc[langCode] = description
          return acc
        }, {})

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

    const fixedHeaders = ['uuid', 'path']
    const dynamicHeaders = []
    langCodes.forEach((langCode) => {
      dynamicHeaders.push(getLabelColumn(langCode), getDescriptionColumn(langCode))
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
    const { uuid, path } = row
    let nodeDef = null
    if (uuid) {
      nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
    } else if (path) {
      const name = Arrays.last(path.split('.'))
      nodeDef = Survey.getNodeDefByName(name)(survey)
    }
    if (!nodeDef) {
      await this.addErrorAndStopCsvReader('cannotFindNodeDef', { uuid, path })
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
