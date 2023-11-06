import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import Job from '@server/job/job'
import * as CSVReader from '@server/utils/file/csvReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { Arrays, SystemError } from '@openforis/arena-core'

const errorPrefix = `validationErrors.surveyLabelsImport.`
const getLabelColumn = (langCode) => `label_${langCode}`
const getDescriptionColumn = (langCode) => `description_${langCode}`

const getNodeDef = ({ survey, row }) => {
  const { uuid, path } = row
  let nodeDef = null
  if (uuid) {
    nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
  } else if (path) {
    const name = Arrays.last(path)
    nodeDef = Survey.getNodeDefByName(name)(survey)
  }
  if (!nodeDef) {
    throw new SystemError(`${errorPrefix}.cannotFindNodeDef`, { uuid, path })
  }
  return nodeDef
}

const validateHeaders =
  ({ survey }) =>
  (headers) => {
    const langCodes = Survey.getLanguages(Survey.getSurveyInfo(survey))
    const mandatoryHeaders = ['uuid']
    const validHeaders = [...mandatoryHeaders]
    langCodes.forEach((langCode) => {
      validHeaders.push(getLabelColumn(langCode), getDescriptionColumn(langCode))
    })
    const invalidHeaders = headers.filter((header) => !validHeaders.includes(header)).join(', ')
    if (invalidHeaders) {
      throw new SystemError(`${errorPrefix}.invalidHeaders`, { invalidHeaders })
    }
  }

export default class SurveyLabelsImportJob extends Job {
  constructor(params) {
    super(SurveyLabelsImportJob.type, params)
  }

  async execute() {
    const { context, tx } = this
    const { filePath, surveyId } = context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)
    const langCodes = Survey.getLanguages(Survey.getSurveyInfo(survey))

    const nodeDefsUpdated = []

    CSVReader.createReaderFromFile(
      filePath,
      validateHeaders({ survey }),
      async (row) => {
        const nodeDef = getNodeDef({ survey, row })
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

    await NodeDefManager.updateNodeDefPropsInBatch({ surveyId, nodeDef: nodeDefsUpdated }, tx)
  }
}

SurveyLabelsImportJob.type = 'SurveyLabelsImportJob'
