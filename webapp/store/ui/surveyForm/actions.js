import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState } from '@webapp/store/survey'
import * as SurveyFormState from './state'

/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS EDIT.
 */

export const formReset = 'survey/form/reset'
export const resetForm = () => (dispatch) => dispatch({ type: formReset })

// Tree select view mode
export const treeSelectViewModeUpdate = 'survey/form/treeSelect/viewMode/update'

export const setTreeSelectViewMode = (mode) => (dispatch) => dispatch({ type: treeSelectViewModeUpdate, mode })

export const formNodeDefAddChildToUpdate = 'survey/form/nodeDef/addChildTo/update'

// Active nodeDef (if tree select view mode is "allNodes")
export const formActiveNodeDefUpdate = 'survey/form/activeNodeDef/update'

export const setFormActiveNodeDefUuid = (nodeDefUuid) => (dispatch) =>
  dispatch({ type: formActiveNodeDefUpdate, nodeDefUuid })

// Node def add-child-to
export const setFormNodeDefAddChildTo = (nodeDef) => (dispatch) =>
  dispatch({ type: formNodeDefAddChildToUpdate, nodeDef })

// Current nodeDef of active form page
export const formActivePageNodeDefUpdate = 'survey/form/activePageNodeDef/update'

export const setFormActivePage =
  ({ nodeDef, showAddChildTo = false }) =>
  (dispatch) =>
    dispatch({ type: formActivePageNodeDefUpdate, nodeDef, showAddChildTo })

// Current node of active form page
export const formPageNodesUpdate = 'survey/form/pageNodes/update'

// Sets the node (entity) for a page (identified by the entity def)
// and reset the node set for the descendant entity defs.
export const setFormPageNode = (nodeDef, nodeIId) => (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)
  const survey = SurveyState.getSurvey(state)
  const formPageNodeIIdByNodeDefUuid = {}

  Survey.visitDescendantsAndSelf({
    nodeDef,
    visitorFn: (descendantNodeDef) => {
      if (NodeDef.isEntity(descendantNodeDef) && NodeDefLayout.hasPage(cycle)(descendantNodeDef)) {
        const formPageNodeIId = NodeDef.isEqual(descendantNodeDef)(nodeDef) ? nodeIId : null
        formPageNodeIIdByNodeDefUuid[NodeDef.getUuid(descendantNodeDef)] = formPageNodeIId
      }
    },
  })(survey)

  dispatch({ type: formPageNodesUpdate, formPageNodeIIdByNodeDefUuid })
}

// Toggle form page navigation
export const formShowPageNavigationUpdate = 'survey/form/showPageNavigation/update'

export const toggleFormPageNavigation = () => (dispatch, getState) => {
  const showPageNavigation = !SurveyFormState.showPageNavigation(getState())
  dispatch({ type: formShowPageNavigationUpdate, showPageNavigation })
}

// Toggle form page navigation expanded
export const formExpandedPageNavigationUpdate = 'survey/form/expandedPageNavigation/update'

export const toggleExpandedFormPageNavigation = () => (dispatch, getState) => {
  const expandedPageNavigation = !SurveyFormState.expandedPageNavigation(getState())
  dispatch({ type: formExpandedPageNavigationUpdate, expandedPageNavigation })
}

// toggle form nodeDef label function
export const formUpdateNodeDefLabelType = 'survey/form/updateNodeDefLabelType/update'
export const updateNodeDefLabelType = () => (dispatch, getState) => {
  const nodeDefLabelType = SurveyFormState.getNodeDefLabelType(getState())

  dispatch({
    type: formUpdateNodeDefLabelType,
    nodeDefLabelType:
      nodeDefLabelType === NodeDef.NodeDefLabelTypes.label
        ? NodeDef.NodeDefLabelTypes.name
        : NodeDef.NodeDefLabelTypes.label,
  })
}
