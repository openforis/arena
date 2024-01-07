import Job from '@server/job/job'

import * as Category from '@core/survey/category'

import * as CategoryManager from '../manager/categoryManager'

export class CategoryValidationJob extends Job {
  constructor(params, type = CategoryValidationJob.type) {
    super(type, params)
  }

  async execute() {
    const { category, survey } = this.context
    const categoryUpdated = await CategoryManager.validateCategory(
      {
        survey,
        categoryUuid: Category.getUuid(category),
        onProgress: ({ total }) => {
          this.total = total
          this.incrementProcessedItems()
        },
      },
      this.tx
    )
    this.setContext({ category: categoryUpdated })
  }
}

CategoryValidationJob.type = 'CategoryValidationJob'
