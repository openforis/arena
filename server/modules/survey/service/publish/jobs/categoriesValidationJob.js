import * as A from '@core/arena'

import Job from '@server/job/job'

import * as Category from '@core/survey/category'
import * as Validation from '@core/validation/validation'

import * as CategoryManager from '../../../../category/manager/categoryManager'

const _removeWarnings = (validation) => {
  const fieldValidations = Validation.getFieldValidations(validation)

  // remove warnings from fields validations
  const fieldValidationsErrors = Object.entries(fieldValidations).reduce((acc, [field, fieldValidation]) => {
    const fieldValidationWithoutWarnings = _removeWarnings(fieldValidation)
    return Validation.isError(fieldValidationWithoutWarnings)
      ? { ...acc, [field]: fieldValidationWithoutWarnings }
      : acc
  }, {})

  return Validation.cleanup({
    ...validation,
    [Validation.keys.fields]: fieldValidationsErrors,
    [Validation.keys.warnings]: [],
    // exclude errors if field validations are empty and error keys are related to the children items
    [Validation.keys.errors]: Validation.getErrors(validation).filter(
      (error) =>
        !(
          A.isEmpty(fieldValidationsErrors) &&
          [
            Validation.messageKeys.categoryEdit.childrenEmpty,
            Validation.messageKeys.categoryEdit.itemsEmpty,
            Validation.messageKeys.categoryEdit.itemsInvalid,
          ].includes(error.key)
        )
    ),
  })
}

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
      const validationWithoutWarnings = _removeWarnings(validation)
      if (!Validation.isValid(validationWithoutWarnings)) {
        const fieldValidations = Validation.getFieldValidations(validation)
        if (!A.isEmpty(fieldValidations)) {
          this.addError(fieldValidations, Category.getName(category))
        }
      }
      this.incrementProcessedItems()
    })

    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'
