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

    let errors = ''
    categoriesArr.forEach((category) => {
      const validation = Validation.getValidation(category)
      if (!Validation.isValid(validation)) {
        errors = errors + Validation.getFieldValidations(validation)
      }
      this.incrementProcessedItems()
    })

    if (errors !== '') {
      this.addError(errors, 'aaaa')
    }
    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'
