import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { appUserLogout } from '@webapp/app/actions'
import { surveyCreate, surveyDelete, surveyUpdate } from '@webapp/survey/actions'
import { nodeDefDelete, nodeDefSave } from '@webapp/survey/nodeDefs/actions'
import { recordLoad } from '../record/actions'
import {
  formActivePageNodeDefUpdate,
  formNodeDefAddChildToUpdate,
  formPageNodeUpdate,
  formReset,
  formShowPageNavigationUpdate,
} from './actions'
import * as SurveyFormState from './surveyFormState'

const actionHandlers = {
  // Reset form
  [appUserLogout]: () => ({}),

  [surveyCreate]: () => ({}),
  [surveyUpdate]: () => ({}),
  [surveyDelete]: () => ({}),

  [formReset]: () => ({}),

  // Form actions
  [formNodeDefAddChildToUpdate]: (state, { nodeDef }) => SurveyFormState.assocNodeDefAddChildTo(nodeDef)(state),

  [formActivePageNodeDefUpdate]: (state, { nodeDef }) =>
    R.pipe(SurveyFormState.assocFormActivePage(nodeDef), SurveyFormState.assocNodeDefAddChildTo(null))(state),

  [formPageNodeUpdate]: (state, { nodeDef, node }) =>
    SurveyFormState.assocFormPageNode(NodeDef.getUuid(nodeDef), node)(state),

  [formShowPageNavigationUpdate]: (state, { showPageNavigation }) =>
    SurveyFormState.setShowPageNavigation(showPageNavigation)(state),

  // Node def actions
  [nodeDefDelete]: (state, { nodeDef }) => SurveyFormState.dissocParamsOnNodeDefDelete(nodeDef)(state),

  [nodeDefSave]: (state, { nodeDef, nodeDefParent, surveyCycleKey }) => {
    if (NodeDef.isEntity(nodeDef)) {
      const pageUuid = NodeDefLayout.getPageUuid(surveyCycleKey)(nodeDef)
      // When changing displayIn (pageUuid) change form active page
      const activePageNodeDef = pageUuid ? nodeDef : nodeDefParent
      return SurveyFormState.assocFormActivePage(activePageNodeDef)(state)
    }

    return state
  },

  // Record
  [recordLoad]: (state, { nodeDefActivePage, formPageNodeUuidByNodeDefUuid }) =>
    R.pipe(
      SurveyFormState.assocNodeDefAddChildTo(null),
      SurveyFormState.assocFormPageNodes(formPageNodeUuidByNodeDefUuid),
      SurveyFormState.assocFormActivePage(nodeDefActivePage),
    )(state),
}

export default exportReducer(actionHandlers)
