import * as Survey from '@core/survey/survey'

import Job from '@server/job/job'
import * as CSVReader from '@server/utils/file/csvReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { SystemError } from '@openforis/arena-core'

const validateHeaders =
  ({ survey }) =>
  (headers) => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    const langCodes = Survey.getLanguages(surveyInfo)
    const mandatoryHeaders = ['uuid']
    const validHeaders = [...mandatoryHeaders]
    langCodes.forEach((langCode) => {
      validHeaders.push(`label_${langCode}`, `description_${langCode}`)
    })
    const invalidHeaders = headers.filter((header) => !validHeaders.includes(header))
    
  }

export default class SurveyLabelsImportJob extends Job {
  constructor(params) {
    super('SurveyLabelsImportJob', params)
  }

  async execute() {
    const { filePath, surveyId } = this.context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)

    CSVReader.createReaderFromFile(filePath, validateHeaders({ survey }), async (row) => {})
  }
}
