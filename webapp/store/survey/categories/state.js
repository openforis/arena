import * as A from '@core/arena'

export const stateKey = 'categories'

export const dissocCategory = (categoryUuid) => A.dissoc(categoryUuid)

export const assocCategory = (category) => A.assoc(category)
