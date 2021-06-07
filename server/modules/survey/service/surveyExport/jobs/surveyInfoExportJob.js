import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { ExportFile } from '../exportFile'

export default class SurveyInfoExportJob extends Job {
  constructor(params) {
    super('SurveyInfoExportJob', params)
  }

  async execute() {
    const { archive, backup, surveyId } = this.context

    // fetch survey with combined props and propsDraft to get proper survey info
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, this.tx)

    // fetch survey with props and propsDraft not combined together to get a full export
    const surveyFull = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, advanced: true, backup },
      this.tx
    )
    archive.append(JSON.stringify(surveyFull, null, 2), { name: ExportFile.survey })

    this.setContext({ survey })
  }
}
