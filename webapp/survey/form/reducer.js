import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyCurrentUpdate } from '../actions'

import {
  formActivePageNodeDefUpdate,
  formNodeDefEditUpdate,
  formNodeDefUnlockedUpdate,
  formPageNodeUpdate,
  formReset
} from './actions'

import {
  assocFormActivePage,
  assocFormNodeDefEdit,
  assocFormPageNode,
  assocNodeDefFormUnlocked
} from './surveyFormState'

const actionHandlers = {
  // reset form
  [surveyCurrentUpdate]: () => null,

  [formReset]: () => null,

  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) => assocFormActivePage(nodeDef)(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),
}

export default exportReducer(actionHandlers)