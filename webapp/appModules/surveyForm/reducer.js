import { exportReducer } from '../../appUtils/reduxUtils'

import { surveyUpdate } from '../../survey/actions'

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
  assocNodeDefFormUnlocked,
  assocParamsOnNodeDefCreate,
} from './surveyFormState'

import { nodeDefCreate } from '../../survey/nodeDefs/actions'

const actionHandlers = {
  // reset form
  [surveyUpdate]: () => null,

  [formReset]: () => null,

  [formNodeDefEditUpdate]: (state, {nodeDef}) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefUnlockedUpdate]: (state, {nodeDef}) => assocNodeDefFormUnlocked(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, {nodeDef}) => assocFormActivePage(nodeDef)(state),

  [formPageNodeUpdate]: (state, {nodeDef, node}) => assocFormPageNode(nodeDef, node)(state),

  // node def
  [nodeDefCreate]: (state, {nodeDef}) => assocParamsOnNodeDefCreate(nodeDef)(state)
}

export default exportReducer(actionHandlers)