const Job = require('../../../../../job/job')

const Category = require('../../../../../../common/survey/category')
const Validation = require('../../../../../../common/validation/validation')

const CategoryManager = require('../../../../category/manager/categoryManager')

class CategoriesValidationJob extends Job {

  constructor (params) {
    super(CategoriesValidationJob.type, params)
  }

  async execute (tx) {
    const categories = await CategoryManager.fetchCategoriesAndLevelsBySurveyId(this.surveyId, true, true, tx)

    this.total = categories.length

    for (const category of categories) {
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