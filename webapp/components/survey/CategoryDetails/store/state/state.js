import * as A from '@core/arena'

const keys = {
  category: 'category',
  importSummary: 'importSummary',
  inCategoriesPath: 'inCategoriesPath',
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
  onCategoryCreated: 'onCategoryCreated',
}

export const create = ({ inCategoriesPath }) => ({
  [keys.inCategoriesPath]: inCategoriesPath,
})

export const getCategory = A.prop(keys.category)
export const isInCategoriesPath = A.prop(keys.inCategoriesPath)
export const getImportSummary = A.prop(keys.importSummary)

export const assocCategory = (category) => A.assoc(keys.category, category)
