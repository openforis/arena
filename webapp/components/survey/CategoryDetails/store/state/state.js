import * as A from '@core/arena'

const keys = {
  category: 'category',
  importSummary: 'importSummary',
  levelItems: 'levelItems',
  levelActiveItems: 'levelActiveItems',
}

export const create = ({ category }) => ({
  [keys.category]: category,
})

export const getCategory = A.prop(keys.category)
export const getImportSummary = A.prop(keys.importSummary)
