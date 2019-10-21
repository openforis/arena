const Job = require('../../../../../job/job')

const Category = require('../../../../../../core/survey/category')
const Validation = require('../../../../../../core/validation/validation')

const CategoryManager = require('../../../../category/manager/categoryManager')

class CategoriesValidationJob extends Job {

  constructor (params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute (tx) {
    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId(this.surveyId, true, true, tx)

    const categoriesArr = Object.values(categories)

    this.total = categoriesArr.length

    for (const category of categoriesArr) {
      const validation = Validation.getValidation(category)
      if (!Validation.isValid(validation)) {
        this.addError(Validation.getFieldValidations(validation), Category.getName(category))
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