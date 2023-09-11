import * as A from '@core/arena'

import * as Category from '@core/survey/category'

export const stateKey = 'categories'

export const dissocCategory = (categoryUuid) => A.dissoc(categoryUuid)

export const assocCategory = (category) => A.assoc(Category.getUuid(category), category)
