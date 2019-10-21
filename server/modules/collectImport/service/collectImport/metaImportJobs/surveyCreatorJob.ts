import * as R from 'ramda'

import Survey from '../../../../../../core/survey/survey'

import Job from '../../../../../job/job'

import SurveyManager from '../../../../survey/manager/surveyManager'

import CollectSurvey from '../model/collectSurvey'

export default class SurveyCreatorJob extends Job {
  static type: string = 'SurveyCreatorJob'
  context: any

  constructor (params?) {
    super(SurveyCreatorJob.type, params)
  }

  async execute (tx) {
    const { collectSurvey } = this.context

    const collectUri = CollectSurvey.getChildElementText('uri')(collectSurvey) as string;

    const name = R.pipe(R.split('/'), R.last)(collectUri)

    const languages = R.pipe(
      CollectSurvey.getElementsByName('language'),
      R.map(CollectSurvey.getText)
    )(collectSurvey) as string[]

    const defaultLanguage = languages[0]

    const collectProjectLabels = CollectSurvey.getElementsByName('project')(collectSurvey)
    // XXX: toLabels first parameter used to be collectProjectLabels, which is an array (and toLabels to a string!)
    const label = CollectSurvey.toLabels(collectProjectLabels[0], defaultLanguage)[defaultLanguage]

    const survey = await SurveyManager.createSurvey(this.user, {
      name,
      label,
      lang: defaultLanguage,
      collectUri
    }, false, tx)

    const surveyId = Survey.getId(survey)

    await SurveyManager.updateSurveyProp(this.user, surveyId, Survey.infoKeys.languages, languages, tx)

    this.setContext({ survey, surveyId, defaultLanguage })
  }
}
