import * as A from '@core/arena'

import * as Category from '@core/survey/category'
import * as CategoryImportSummary from '@core/survey/categoryImportSummary'

const keys = {
  category: 'category',
  importSummary: 'importSummary',
  inCategoriesPath: 'inCategoriesPath',
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
}

export const create = ({ inCategoriesPath }) => ({
  [keys.inCategoriesPath]: inCategoriesPath,
})

export const getCategory = A.prop(keys.category)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)
export const getImportSummary = A.prop(keys.importSummary)

export const assocCategory = ({ category }) => A.assoc(keys.category, category)
export const assocCategoryProp = ({ key, value }) => (state) => {
  const category = getCategory(state)
  const categoryUpdated = Category.assocProp({ key, value })(category)
  return assocCategory({ category: categoryUpdated })(state)
}
export const assocImportSummary = ({ summary }) => A.assoc(keys.importSummary, summary)
export const assocImportSummaryColumnDataType = ({ columnName, dataType }) => (state) => {
  const summary = getImportSummary(state)
  const summaryUpdated = CategoryImportSummary.assocColumnDataType(columnName, dataType)(summary)
  return assocImportSummary({ summary: summaryUpdated })(state)
}
export const dissocImportSummary = A.dissoc(keys.importSummary)
