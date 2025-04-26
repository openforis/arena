import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

const findDeletedLanguages = async ({ surveyId, surveyPublishedPrevious }, t) => {
  const surveyNext = await SurveyManager.fetchSurveyById({ surveyId, draft: true, validate: false }, t)
  const surveyInfoNext = Survey.getSurveyInfo(surveyNext)
  if (Survey.isPublished(surveyInfoNext)) {
    const publishedSurveyInfo = Survey.getSurveyInfo(surveyPublishedPrevious)
    return R.difference(Survey.getLanguages(publishedSurveyInfo), Survey.getLanguages(surveyInfoNext))
  }
  return []
}

export default class SurveyPropsPublishJob extends Job {
  constructor(params) {
    super(SurveyPropsPublishJob.type, params)
  }

  async execute() {
    const { context, surveyId, tx } = this

    const { surveyPublishedPrevious } = context

    this.total = 6

    // fetch survey and node defs as it is before publishing changes and set it in context to use it in other jobs

    const langsDeleted = await findDeletedLanguages({ surveyId, surveyPublishedPrevious }, tx)
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
