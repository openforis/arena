import * as R from 'ramda'

import Job from '../../../../../job/job'

import Survey from '../../../../../../core/survey/survey'

import NodeDefManager from '../../../../nodeDef/manager/nodeDefManager'
import SurveyManager from '../../../manager/surveyManager'
import CategoryManager from '../../../../category/manager/categoryManager'
import TaxonomyManager from '../../../../taxonomy/manager/taxonomyManager'

import ActivityLog from '../../../../activityLog/activityLogger'

const findDeletedLanguages = async (surveyId, t) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, t)
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isPublished(surveyInfo)) {
    const publishedSurvey = await SurveyManager.fetchSurveyById(surveyId, false, false, t)
    const publishedSurveyInfo = Survey.getSurveyInfo(publishedSurvey)
    return R.difference(Survey.getLanguages(publishedSurveyInfo), Survey.getLanguages(surveyInfo))
  } else {
    return []
  }
}

export default class SurveyPropsPublishJob extends Job {
  static type: string = 'SurveyPropsPublishJob'

  constructor (params?) {
    super(SurveyPropsPublishJob.type, params)
  }

  async execute () {
    const { surveyId, user, tx } = this

    this.total = 7

    const langsDeleted = await findDeletedLanguages(surveyId, tx)
    this.incrementProcessedItems()

    await NodeDefManager.permanentlyDeleteNodeDefs(surveyId, tx)
    this.incrementProcessedItems()

    await NodeDefManager.publishNodeDefsProps(surveyId, langsDeleted, tx)
    this.incrementProcessedItems()

    await CategoryManager.publishProps(surveyId, langsDeleted, tx)
    this.incrementProcessedItems()

    await TaxonomyManager.publishTaxonomiesProps(surveyId, tx)
    this.incrementProcessedItems()

    const surveyInfo = await SurveyManager.publishSurveyProps(surveyId, langsDeleted, tx)
    this.incrementProcessedItems()

    await ActivityLog.log(user, surveyId, ActivityLog.type.surveyPublish, { surveyUuid: Survey.getUuid(surveyInfo) }, tx)
    this.incrementProcessedItems()
  }

}
