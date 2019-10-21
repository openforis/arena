import Job from '../../../../../job/job';

import Category from '../../../../../../core/survey/category';
import Validation from '../../../../../../core/validation/validation';

import CategoryManager from '../../../../category/manager/categoryManager';

export default class CategoriesValidationJob extends Job {
  static type: string = 'CategoriesValidationJob'

  constructor (params?) {
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
