import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { TreeSelectViewMode } from '@webapp/model'
import { SystemActions } from '@webapp/store/system'
import { SurveyActions, NodeDefsActions } from '@webapp/store/survey'
import * as RecordActions from '../record/actions'

import * as SurveyFormActions from './actions'
import * as SurveyFormState from './state'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyFormActions.formReset]: () => ({}),

  // Form actions
  [SurveyFormActions.treeSelectViewModeUpdate]: (state, { mode }) =>
    SurveyFormState.assocTreeSelectViewMode(mode)(state),

  [SurveyFormActions.formActiveNodeDefUpdate]: (state, { nodeDefUuid }) =>
    SurveyFormState.assocFormActiveNodeDefUuid(nodeDefUuid)(state),

  [SurveyFormActions.formNodeDefAddChildToUpdate]: (state, { nodeDef }) =>
    SurveyFormState.assocNodeDefAddChildTo(nodeDef)(state),

  [SurveyFormActions.formActivePageNodeDefUpdate]: (state, { nodeDef, showAddChildTo = false }) =>
    R.pipe(
      SurveyFormState.assocFormActivePage(nodeDef),
      SurveyFormState.assocNodeDefAddChildTo(showAddChildTo ? nodeDef : null)
    )(state),

  [SurveyFormActions.formPageNodesUpdate]: (state, { formPageNodeUuidByNodeDefUuid }) =>
    SurveyFormState.assocFormPageNodes(formPageNodeUuidByNodeDefUuid)(state),

  [SurveyFormActions.formShowPageNavigationUpdate]: (state, { showPageNavigation }) =>
    SurveyFormState.setShowPageNavigation(showPageNavigation)(state),

  [SurveyFormActions.formExpandedPageNavigationUpdate]: (state, { expandedPageNavigation }) =>
    SurveyFormState.setExpandedPageNavigation(expandedPageNavigation)(state),

  [SurveyFormActions.formUpdateNodeDefLabelType]: (state, { nodeDefLabelType }) =>
    SurveyFormState.setNodeDefLabelType(nodeDefLabelType)(state),
  // Node def actions
  [NodeDefsActions.nodeDefDelete]: (state, { nodeDef }) => SurveyFormState.dissocParamsOnNodeDefDelete(nodeDef)(state),

  [NodeDefsActions.nodeDefSave]: (state, { nodeDef, nodeDefParent, surveyCycleKey }) => {
    if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
      const displayInParentPage = NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)
      // When changing displayIn change form active page
      const activePageNodeDef = displayInParentPage ? nodeDefParent : nodeDef
      return SurveyFormState.assocFormActivePage(activePageNodeDef)(state)
    }
    return state
  },

  [NodeDefsActions.nodeDefPropsUpdateCancel]: (state, { nodeDef, isNodeDefNew }) => {
    const viewMode = SurveyFormState.getTreeSelectViewMode(state)
    if (isNodeDefNew && viewMode === TreeSelectViewMode.allNodeDefs) {
      return SurveyFormState.assocFormActiveNodeDefUuid(NodeDef.getParentUuid(nodeDef))(state)
    }
    return state
  },

  // Record
  [RecordActions.recordLoad]: (state, { nodeDefActivePage, formPageNodeUuidByNodeDefUuid }) =>
    R.pipe(
      SurveyFormState.assocNodeDefAddChildTo(null),
      SurveyFormState.assocFormPageNodes(formPageNodeUuidByNodeDefUuid),
      SurveyFormState.assocFormActivePage(nodeDefActivePage)
    )(state),
}

export default exportReducer(actionHandlers)
