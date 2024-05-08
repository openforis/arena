import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

const findDeletedLanguages = async (surveyId, t) => {
  const survey = await SurveyManager.fetchSurveyById({ surveyId, draft: true, validate: false }, t)
  const surveyInfo = Survey.getSurveyInfo(survey)
  if (Survey.isPublished(surveyInfo)) {
    const publishedSurvey = await SurveyManager.fetchSurveyById({ surveyId, draft: false, validate: false }, t)
    const publishedSurveyInfo = Survey.getSurveyInfo(publishedSurvey)
    return R.difference(Survey.getLanguages(publishedSurveyInfo), Survey.getLanguages(surveyInfo))
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
