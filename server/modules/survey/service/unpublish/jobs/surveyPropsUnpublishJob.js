import Job from '@server/job/job'

import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'
import * as TaxonomyManager from '@server/modules/taxonomy/manager/taxonomyManager'

export default class SurveyPropsUnpublishJob extends Job {
  constructor(params) {
    super(SurveyPropsUnpublishJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    this.total = 4

    await NodeDefManager.unpublishNodeDefsProps(surveyId, tx)
    this.incrementProcessedItems()

    await CategoryManager.unpublishProps(surveyId, tx)
    this.incrementProcessedItems()

    await TaxonomyManager.unpublishTaxonomiesProps(surveyId, tx)
    this.incrementProcessedItems()

    await SurveyManager.unpublishSurveyProps(surveyId, tx)
    this.incrementProcessedItems()
  }
}

SurveyPropsUnpublishJob.type = 'SurveyPropsUnpublishJob'
