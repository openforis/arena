import * as R from 'ramda'

import { exportReducer } from '@webapp/utils/reduxUtils'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SystemActions } from '@webapp/store/system'
import { SurveyActions, NodeDefsActions } from '@webapp/store/survey'
import { RecordActions } from '@webapp/store/ui/record'
import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

import * as SurveyFormState from '../../../loggedin/surveyViews/surveyForm/surveyFormState'

const actionHandlers = {
  // Reset form
  [SystemActions.SYSTEM_RESET]: () => ({}),

  [SurveyActions.surveyCreate]: () => ({}),
  [SurveyActions.surveyUpdate]: () => ({}),
  [SurveyActions.surveyDelete]: () => ({}),

  [SurveyFormActions.formReset]: () => ({}),

  // Form actions
  [SurveyFormActions.formNodeDefAddChildToUpdate]: (state, { nodeDef }) =>
    SurveyFormState.assocNodeDefAddChildTo(nodeDef)(state),

  [SurveyFormActions.formActivePageNodeDefUpdate]: (state, { nodeDef }) =>
    R.pipe(SurveyFormState.assocFormActivePage(nodeDef), SurveyFormState.assocNodeDefAddChildTo(null))(state),

  [SurveyFormActions.formPageNodeUpdate]: (state, { nodeDef, node }) =>
    SurveyFormState.assocFormPageNode(NodeDef.getUuid(nodeDef), node)(state),

  [SurveyFormActions.formShowPageNavigationUpdate]: (state, { showPageNavigation }) =>
    SurveyFormState.setShowPageNavigation(showPageNavigation)(state),

  // Node def actions
  [NodeDefsActions.nodeDefDelete]: (state, { nodeDef }) => SurveyFormState.dissocParamsOnNodeDefDelete(nodeDef)(state),

  [NodeDefsActions.nodeDefSave]: (state, { nodeDef, nodeDefParent, surveyCycleKey }) => {
    if (NodeDef.isEntity(nodeDef)) {
      const pageUuid = NodeDefLayout.getPageUuid(surveyCycleKey)(nodeDef)
      // When changing displayIn (pageUuid) change form active page
      const activePageNodeDef = pageUuid ? nodeDef : nodeDefParent
      return SurveyFormState.assocFormActivePage(activePageNodeDef)(state)
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
