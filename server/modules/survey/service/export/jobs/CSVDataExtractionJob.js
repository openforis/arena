import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as CategoryManager from '@server/modules/category/manager/categoryManager'

export default class CSVDataExtractionJob extends Job {
  constructor(params) {
    super('CSVDataExtraction', params)
  }

  async execute() {
    const { surveyId, includeCategories, outputDir } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }, this.tx)
    const nodeDefs = Survey.getNodeDefsArray(survey).filter(
      (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef)
    )
    const categories = includeCategories ? await CategoryManager.fetchCategoriesBySurveyId({ surveyId }) : []
    this.total = nodeDefs.length + (includeCategories ? categories.length : 0)

    await SurveyRdbManager.fetchEntitiesDataToCsvFiles(
      {
        surveyId,
        outputDir,
        callback: () => {
          this.incrementProcessedItems()
        },
      },
      this.tx
    )
  }
}
