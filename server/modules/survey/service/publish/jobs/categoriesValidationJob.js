import Job from '@server/job/job'

import * as Category from '@core/survey/category'
import * as Validation from '@core/validation/validation'

import * as CategoryManager from '../../../../category/manager/categoryManager'

export default class CategoriesValidationJob extends Job {
  constructor(params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute() {
    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId(
      { surveyId: this.surveyId, draft: true, includeValidation: true },
      this.tx
    )

    const categoriesArr = Object.values(categories)

    this.total = categoriesArr.length

    categoriesArr.forEach((category) => {
      const validation = Validation.getValidation(category)
      if (!Validation.isValid(validation) && false) {
        this.addError(Validation.getFieldValidations(validation), Category.getName(category))
      }
      this.incrementProcessedItems()
    })

    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'
