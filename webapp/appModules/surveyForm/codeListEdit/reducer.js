import { exportReducer } from '../../../appUtils/reduxUtils'

import { surveyUpdate } from '../../../survey/actions'
import { formReset } from '../actions'

import {
  initCodeListEdit,
  dissocLevel,

  createLevelItem,
  assocLevelItems,
  assocLevelItem,
  assocLevelItemProp,
  dissocLevelItem,

  assocLevelActiveItem,
} from './codeListEditState'

import {
  codeListEditUpdate,

  codeListLevelDelete,

  codeListItemsUpdate,
  codeListEditLevelActiveItemUpdate,

  codeListItemCreate,
  codeListItemUpdate,
  codeListItemPropUpdate,
  codeListItemDelete,
  codeListCreate,
} from './actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [codeListEditUpdate]: (state, {codeListUUID}) => initCodeListEdit(codeListUUID),

  // code List
  [codeListCreate]: (state, {codeList}) => initCodeListEdit(codeList.uuid),

  // ===== code list level
  [codeListLevelDelete]: (state, {level}) => dissocLevel(level.index)(state),

  // ===== code list items
  [codeListItemsUpdate]: (state, {levelIndex, items}) =>
    assocLevelItems(levelIndex, items)(state),

  // ===== code list item
  [codeListItemCreate]: (state, {level, item}) => createLevelItem(level.index, item)(state),

  [codeListItemUpdate]: (state, {level, item}) => assocLevelItem(level.index, item)(state),

  [codeListItemPropUpdate]: (state, {level, item, key, value}) => assocLevelItemProp(level, item, key, value)(state),

  [codeListItemDelete]: (state, {level, item}) => dissocLevelItem(level.index, item.uuid)(state),

  // ===== code list active item
  [codeListEditLevelActiveItemUpdate]: (state, {levelIndex, itemUUID}) =>
    assocLevelActiveItem(levelIndex, itemUUID)(state),
}

export default exportReducer(actionHandlers)