const Job = require('../../../../../job/job')

const Category = require('../../../../../../common/survey/category')
const Validation = require('../../../../../../common/validation/validation')

const CategoryManager = require('../../../../category/manager/categoryManager')

class CategoriesValidationJob extends Job {

  constructor (params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute (tx) {
    const categories = await CategoryManager.fetchCategoriesBySurveyId(this.surveyId, true, false, tx)

    this.total = categories.length

    for (const category of categories) {
      const validatedCategory = await CategoryManager.validateCategory(this.surveyId, categories, category, true)
      const validation = Validation.getValidation(validatedCategory)
      if (!Validation.isValid(validation)) {
        this.addError(Validation.getFieldValidations(validation), Category.getName(validatedCategory))
      }
      this.incrementProcessedItems()
    }

    if (this.hasErrors()) {
      await this.setStatusFailed()
    }
  }
}

CategoriesValidationJob.type = 'CategoriesValidationJob'

module.exports = CategoriesValidationJob