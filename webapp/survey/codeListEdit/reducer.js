import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import {
  assocCodeListEdit,
  dissocLevel,

  assocLevelItems,

  createLevelItem,
  assocLevelItem,
  dissocLevelItem,

  assocLevelActiveItem,
} from './codeListEditState'

import {
  codeListEditUpdate,

  codeListEditLevelDelete,

  codeListEditLevelItemsUpdate,
  codeListEditLevelActiveItemUpdate,

  codeListEditLevelItemCreate,
  codeListEditLevelItemUpdate,
  codeListEditLevelItemDelete,
} from './actions'

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [codeListEditUpdate]: (state, {codeListUUID}) => assocCodeListEdit(codeListUUID),

  // ===== code list level
  [codeListEditLevelDelete]: (state, {levelIndex}) => dissocLevel(levelIndex)(state),

  // ===== code list items
  [codeListEditLevelItemsUpdate]: (state, {levelIndex, items}) =>
    assocLevelItems(levelIndex, items)(state),

  // ===== code list item
  [codeListEditLevelItemCreate]: (state, {levelIndex, item}) => createLevelItem(levelIndex, item)(state),

  [codeListEditLevelItemUpdate]: (state, {levelIndex, item}) => assocLevelItem(levelIndex, item)(state),

  [codeListEditLevelItemDelete]: (state, {levelIndex, itemUUID}) => dissocLevelItem(levelIndex, itemUUID)(state),

  // ===== code list active item
  [codeListEditLevelActiveItemUpdate]: (state, {levelIndex, itemUUID}) =>
    assocLevelActiveItem(levelIndex, itemUUID)(state),
}

export default exportReducer(actionHandlers)