import * as R from 'ramda'

import { combineReducers } from 'redux'
import { exportReducer } from '../../appUtils/reduxUtils'

import categoryEdit from './categoryEdit/reducer'
import taxonomyEdit from './taxonomyEdit/reducer'
import record from './record/reducer'

import { appUserLogout } from '../../app/actions'

import { surveyDelete, surveyUpdate } from '../../survey/actions'

import {
  formActivePageNodeDefUpdate,
  formNodeDefEditUpdate,
  formNodeDefAddChildToUpdate,
  formPageNodeUpdate,
  formReset
} from './actions'

import { nodeDefCreate } from '../../survey/nodeDefs/actions'

import {
  assocFormActivePage,
  assocFormNodeDefEdit,
  assocFormPageNode,
  assocNodeDefAddChildTo,
  assocParamsOnNodeDefCreate,
} from './surveyFormState'

import { recordLoad } from './record/actions'

const actionHandlers = {
  // reset form
  [appUserLogout]: () => ({}),

  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  // form actions
  [formNodeDefEditUpdate]: (state, { nodeDef }) => assocFormNodeDefEdit(nodeDef)(state),

  [formNodeDefAddChildToUpdate]: (state, { nodeDef }) => assocNodeDefAddChildTo(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, { nodeDef }) =>
    R.pipe(
      assocFormActivePage(nodeDef),
      assocNodeDefAddChildTo(null)
    )(state),

  [formPageNodeUpdate]: (state, { nodeDef, node }) => assocFormPageNode(nodeDef, node)(state),

  // node def
  [nodeDefCreate]: (state, { nodeDef }) => assocParamsOnNodeDefCreate(nodeDef)(state),

  // record (preview)
  [recordLoad]: state => assocNodeDefAddChildTo(null)(state)
}

const props = exportReducer(actionHandlers)

export default combineReducers({
  props,
  categoryEdit,
  taxonomyEdit,
  record,
})

