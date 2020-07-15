import * as A from '@core/arena'

import * as Category from '@core/survey/category'

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
export const assocCategoryProp = ({ key, value }) => (state) =>
  A.pipe(getCategory, Category.assocProp({ key, value }), (category) => assocCategory({ category: category })(state))(
    state
  )
