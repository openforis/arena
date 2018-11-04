import * as R from 'ramda'

import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyUpdate } from '../actions'
import { formReset } from '../form/actions'

import { codeListsUpdate } from './actions'
import { getCodeLists, assocCodeLists } from '../../../common/survey/survey'
import {
  codeListCreate,
  codeListDelete,
  codeListUpdate,
  codeListPropUpdate,
  codeListLevelPropUpdate, codeListItemPropUpdate, codeListLevelDelete,
} from '../../appModules/designer/codeListEdit/actions'

const simulateSurveyState = (codeLists) =>
  codeLists ? {codeLists} : {}

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,
  [formReset]: () => null,

  [codeListsUpdate]: (state, {codeLists}) => R.pipe(
    assocCodeLists(codeLists),
    getCodeLists,
  )(simulateSurveyState(state)),

  // code list
  [codeListCreate]: (state, {codeList}) => R.assoc(codeList.uuid, codeList, state),

  [codeListUpdate]: (state, {codeList}) => R.assoc(codeList.uuid, codeList, state),

  [codeListPropUpdate]: (state, {codeList, key, value}) => R.pipe(
    R.assocPath([codeList.uuid, 'props', key], value),
    R.dissocPath([codeList.uuid, 'validation', 'fields', key])
  )(state),

  [codeListDelete]: (state, {codeList}) => R.dissoc(codeList.uuid, state),

  // code list level
  [codeListLevelPropUpdate]: (state, {codeList, level, key, value}) => R.pipe(
    R.assocPath([codeList.uuid, 'levels', level.index + '', 'props', key], value),
    R.dissocPath([codeList.uuid, 'levels', level.index + '', 'validation', 'fields', key])
  )(state),

  [codeListLevelDelete]: (state, {codeList, level}) =>
    R.dissocPath([codeList.uuid, 'levels', level.index + ''])(state),

  // code list items
  [codeListItemPropUpdate]: (state, {codeList, item, key}) =>
    R.dissocPath([codeList.uuid, 'validation', 'fields', 'items', 'fields', item.uuid, 'fields', key])
    (state),

}

export default exportReducer(actionHandlers)