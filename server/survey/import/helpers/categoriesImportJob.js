const R = require('ramda')

const Category = require('../../../../common/survey/category')

const Job = require('../../../job/job')

const CategoryManager = require('../../../category/categoryManager')

const XMLParseUtils = require('./xmlParseUtils')

/**
 * Inserts a category for each code list in the Collect survey.
 * Saves the list of inserted categories in the "categories" context property
 */
class CategoriesImportJob extends Job {

  constructor (params) {
    super('CategoriesImportJob', params)
  }

  async execute (tx) {
    const { surveySource, surveyId } = this.context

    this.context.categories = []

    const codeLists = XMLParseUtils.getList(surveySource.codeLists.list)

    this.total = codeLists.length

    for (const codeList of codeLists) {
      // 1. insert a category for each codeList
      const categoryParam = Category.newCategory({
        [Category.props.name]: codeList._attr.name
      })
      const category = await CategoryManager.insertCategory(this.user, surveyId, categoryParam, tx)

      const firstLevel = Category.getLevelByIndex(0)(category)
      const levelUuid = Category.getUuid(firstLevel)

      // 2. insert items in each level
      //TODO insert items in nested levels

      const defaultLanguage = this.context.defaultLanguage

      for (const itemSource of R.pathOr([], ['items', 'item'], codeList)) {
        const labels = XMLParseUtils.toLabels(itemSource.label, defaultLanguage)

        const itemParam = Category.newItem(levelUuid, null, {
          [Category.itemProps.code]: itemSource.code,
          [Category.itemProps.labels]: labels
        })
        await CategoryManager.insertItem(this.user, surveyId, itemParam, tx)
      }

      this.context.categories.push(category)

      this.incrementProcessedItems()
    }
  }
}

module.exports = CategoriesImportJob
