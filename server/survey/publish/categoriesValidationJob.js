const R = require('ramda')

const Job = require('../../job/job')

const Category = require('../../../common/survey/category')
const {isValid, getInvalidFieldValidations} = require('../../../common/validation/validator')

const CategoryManager = require('../../category/categoryManager')

class CategoriesValidationJob extends Job {

  constructor (params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute () {
    const categories = await CategoryManager.fetchCategoriesBySurveyId(this.surveyId, true, false)

    this.total = categories.length

    for (const category of categories) {
      const validatedCategory = await CategoryManager.validateCategory(this.surveyId, categories, category, true)
      if (!isValid(validatedCategory)) {
        this.errors[Category.getName(validatedCategory)] = getInvalidFieldValidations(validatedCategory.validation)
      }
      this.incrementProcessedItems()
    }
    if (R.isEmpty(this.errors)) {
      this.setStatusSucceeded()
    } else {
      this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'

module.exports = CategoriesValidationJob