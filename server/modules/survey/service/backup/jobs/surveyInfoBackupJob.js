import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class SurveyInfoBackupJob extends Job {
  constructor(params) {
    super('SurveyInfoBackupJob', params)
  }

  async execute() {
    const { archive, surveyId } = this.context

    // fetch survey with combined props and propsDraft to get proper survey info
    const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true })

    // fetch survey with props and propsDraft not combined together to get a full export
    const surveyFull = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId,
      draft: true,
      advanced: true,
      backup: true,
    })
    archive.append(JSON.stringify(surveyFull, null, 2), { name: 'survey.json' })

    this.setContext({ survey })
  }
}
