import * as A from '@core/arena'
import * as Category from '@core/survey/category'

import { State as ListState } from '../../../store'

export const keys = {
  category: 'category',
  initData: 'initData',
  listState: 'listState',
  position: 'position',
  unused: 'unused',
}

// ==== CREATE
export const create = ({ category, initData, listState, position, unused }) => ({
  [keys.category]: category,
  [keys.initData]: initData,
  [keys.listState]: listState,
  [keys.position]: position,
  [keys.unused]: unused,
})

// ==== READ
export const getCategory = A.prop(keys.category)
export const getInitData = A.prop(keys.initData)
export const getListState = A.prop(keys.listState)
export const getPosition = A.prop(keys.position)
export const isUnused = A.prop(keys.unused)

export const isSelected = (state) => {
  const selectedItemUuid = A.pipe(getListState, ListState.getSelectedItemUuid)(state)
  return selectedItemUuid && selectedItemUuid === Category.getUuid(getCategory(state))
}

// ==== UPDATE
export const assocSelectedItemUuid = A.assoc(keys.selectedItemUuid)
