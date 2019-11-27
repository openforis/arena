import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as NodeDefManager from '../../../../nodeDef/manager/nodeDefManager'
import * as SurveyManager from '../../../manager/surveyManager'
import * as CategoryManager from '../../../../category/manager/categoryManager'
import * as TaxonomyManager from '../../../../taxonomy/manager/taxonomyManager'

const findDeletedLanguages = async (surveyId, t) => {
  const survey = await SurveyManager.fetchSurveyById(surveyId, true, false, t)
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isPublished(surveyInfo)) {
    const publishedSurvey = await SurveyManager.fetchSurveyById(
      surveyId,
      false,
      false,
      t,
    )
    const publishedSurveyInfo = Survey.getSurveyInfo(publishedSurvey)
    return R.difference(
      Survey.getLanguages(publishedSurveyInfo),
      Survey.getLanguages(surveyInfo),
    )
  }

  return []
}

export default class SurveyPropsPublishJob extends Job {
  constructor(params) {
    super(SurveyPropsPublishJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 6

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

    await SurveyManager.publishSurveyProps(surveyId, langsDeleted, tx)
    this.incrementProcessedItems()
  }
}

SurveyPropsPublishJob.type = 'SurveyPropsPublishJob'
