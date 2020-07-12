import * as A from '@core/arena'

const keys = {
  category: 'category',
  importSummary: 'importSummary',
  inCategoriesPath: 'inCategoriesPath',
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
}

export const create = ({ category, inCategoriesPath }) => ({
  [keys.category]: category,
  [keys.inCategoriesPath]: inCategoriesPath,
})

export const getCategory = A.prop(keys.category)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)
export const getImportSummary = A.prop(keys.importSummary)
