import { combineReducers } from 'redux'
import { exportReducer } from '../../appUtils/reduxUtils'

import codeListEdit from './codeListEdit/reducer'
import taxonomyEdit from './taxonomyEdit/reducer'
import record from './record/reducer'

import { surveyDelete, surveyUpdate } from '../../survey/actions'

import {
  formActivePageNodeDefUpdate,
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formPageNodeUpdate,
  formReset
} from './actions'

import { nodeDefCreate } from '../../survey/nodeDefs/actions'

import {
  assocFormActivePage,
  assocFormNodeDefEdit,
  assocFormPageNode,
  assocNodeDefFormUnlocked,
  assocParamsOnNodeDefCreate,
} from './surveyFormState'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) => assocFormActivePage(nodeDef)(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),

  // node def
  [nodeDefCreate]: (state, {nodeDef}) => assocParamsOnNodeDefCreate(nodeDef)(state)
}

const props = exportReducer(actionHandlers)

export default combineReducers({
  props,
  codeListEdit,
  taxonomyEdit,
  record,
})

