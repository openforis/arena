import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'
import { formReset } from '../form/actions'

import {
  codeListEditActiveLevelItemUpdate,
  codeListEditLevelItemsUpdate,
  codeListEditUpdate,
  codeListsUpdate
} from './actions'
import { getCodeLists, assocCodeLists } from '../../../common/survey/survey'

import {
  assocCodeListEditLevelItem,
  assocCodeListEditLevelItems,
  dissocCodeListEditLevelItems,
  updateCodeListEdit
} from './codeListsState'

const simulateSurveyState = (codeLists) =>
  codeLists ? {codeLists} : {}

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,
  [formReset]: () => null,

  [codeListsUpdate]: (state, {codeLists}) => R.pipe(
    assocCodeLists(codeLists),
    getCodeLists,
  )(simulateSurveyState(state)),

  [codeListEditUpdate]: (state, {codeListUUID}) =>
    updateCodeListEdit(codeListUUID)(state),

  [codeListEditLevelItemsUpdate]: (state, {levelIndex, items}) =>
    items === null
      ? dissocCodeListEditLevelItems(levelIndex)(state)
      : assocCodeListEditLevelItems(levelIndex, items)(state),

  [codeListEditActiveLevelItemUpdate]: (state, {levelIndex, itemUUID}) =>
    assocCodeListEditLevelItem(levelIndex, itemUUID)(state),

}

export default exportReducer(actionHandlers)