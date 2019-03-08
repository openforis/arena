const R = require('ramda')

const Job = require('../../job/job')

const Category = require('../../../common/survey/category')
const Validator = require('../../../common/validation/validator')

const CategoryManager = require('../../modules/category/persistence/categoryManager')

class CategoriesValidationJob extends Job {

  constructor (params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute (tx) {
    const categories = await CategoryManager.fetchCategoriesBySurveyId(this.surveyId, true, false, tx)

    this.total = categories.length

    for (const category of categories) {
      const validatedCategory = await CategoryManager.validateCategory(this.surveyId, categories, category, true)
      if (!Validator.isValid(validatedCategory)) {
        this.errors[Category.getName(validatedCategory)] = Validator.getInvalidFieldValidations(validatedCategory.validation)
      }
      this.incrementProcessedItems()
    }

    if (!R.isEmpty(this.errors)) {
      this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'

module.exports = CategoriesValidationJob