import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { TreeSelectViewMode } from '@webapp/model'
import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

import * as UiState from '../state'

export const stateKey = 'surveyForm'
const getState = A.pipe(UiState.getState, A.propOr({}, stateKey))
const getStateProp = (prop, defaultTo = null) => A.pipe(getState, A.propOr(defaultTo, prop))

const keys = {
  treeSelectViewMode: 'treeSelectViewMode', // Tree select view mode
  nodeDefUuid: 'nodeDefUuid', // Current node def (if view mode is "allNodeDefs")
  nodeDefUuidPage: 'nodeDefUuidPage', // Current page nodeDef
  nodeDefUuidAddChildTo: 'nodeDefUuidAddChildTo', // NodeDef (entity) selected to add children to
  nodeDefUuidPageNodeUuid: 'nodeDefUuidPageNodeUuid', // Map of nodeDefUuid -> nodeUuid representing the node loaded in page nodeDefUuid
  showPageNavigation: 'showPageNavigation',
  expandedPageNavigation: 'expandedPageNavigation',
  nodeDefLabelType: 'nodeDefLabelType', // NodeDef label function
}

// context state is global state
export const getGlobalStateTreeSelectViewMode = getStateProp(keys.treeSelectViewMode, TreeSelectViewMode.onlyPages)
// context state is SurveyFormState
export const getTreeSelectViewMode = A.propOr(TreeSelectViewMode.onlyPages, keys.treeSelectViewMode)
export const assocTreeSelectViewMode = A.assoc(keys.treeSelectViewMode)

export const getFormActiveNodeDefUuid = (state) =>
  getStateProp(keys.nodeDefUuid, NodeDef.getUuid(getFormActivePageNodeDef(state)))(state)
export const assocFormActiveNodeDefUuid = A.assoc(keys.nodeDefUuid)

// ====== nodeDefUuidPage

export const assocFormActivePage = (nodeDef) =>
  A.ifElse(
    A.always(A.isNil(nodeDef)),
    A.dissoc(keys.nodeDefUuidPage),
    A.assoc(keys.nodeDefUuidPage, NodeDef.getUuid(nodeDef))
  )

export const getFormActivePageNodeDef = (state) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidPage = getStateProp(keys.nodeDefUuidPage)(state)
  if (Objects.isEmpty(survey) || Objects.isEmpty(Survey.getNodeDefs(survey))) return null

  return nodeDefUuidPage ? Survey.getNodeDefByUuid(nodeDefUuidPage)(survey) : Survey.getNodeDefRoot(survey)
}

export const isNodeDefFormActivePage = (nodeDef) =>
  A.pipe(getFormActivePageNodeDef, A.propEq(NodeDef.keys.uuid, NodeDef.getUuid(nodeDef)))

// ====== nodeDefUuidAddChildTo

export const assocNodeDefAddChildTo = (nodeDef) => A.assoc(keys.nodeDefUuidAddChildTo, NodeDef.getUuid(nodeDef))

export const getNodeDefAddChildTo = (state) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidAddChildTo = getStateProp(keys.nodeDefUuidAddChildTo)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidAddChildTo)(survey)
}

// ====== nodeDefUuidPageNodeUuid

export const assocFormPageNode = (nodeDefUuid, nodeUuid) => {
  const path = [keys.nodeDefUuidPageNodeUuid, nodeDefUuid]
  return nodeUuid ? A.assocPath(path, nodeUuid) : A.dissocPath(path)
}

export const assocFormPageNodes = (formPageNodeUuidByNodeDefUuid) => (state) =>
  A.pipe(
    A.keys,
    A.reduce((stateAcc, nodeDefUuid) => {
      const nodeUuid = A.prop(nodeDefUuid, formPageNodeUuidByNodeDefUuid)
      return assocFormPageNode(nodeDefUuid, nodeUuid)(stateAcc)
    }, state)
  )(formPageNodeUuidByNodeDefUuid)

export const getPagesUuidMap = getStateProp(keys.nodeDefUuidPageNodeUuid, {})

export const getFormPageNodeUuid = (nodeDef) => A.pipe(getPagesUuidMap, A.prop(NodeDef.getUuid(nodeDef)))

export const getFormPageParentNode = (nodeDef) => (state) => {
  const survey = SurveyState.getSurvey(state)
  const record = RecordState.getRecord(state)

  if (!record) return null

  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  if (nodeDefParent) {
    if (NodeDef.isRoot(nodeDefParent)) {
      return Record.getRootNode(record)
    }

    const parentNodeUuid = getFormPageNodeUuid(nodeDefParent)(state)
    if (parentNodeUuid) {
      const mappedParent = Record.getNodeByUuid(parentNodeUuid)(record)
      if (mappedParent) return mappedParent
    }

    // Fallback only for single parents: using [0] on a multiple entity would
    // bind the form to an arbitrary instance. Multiples must be in pagesUuidMap.
    if (NodeDef.isMultiple(nodeDefParent)) return null

    const parentNodes = Record.getNodesByDefUuid(NodeDef.getUuid(nodeDefParent))(record)
    return parentNodes?.[0] ?? null
  }

  return null
}

// ====== Page navigation

export const showPageNavigation = getStateProp(keys.showPageNavigation, true)

export const setShowPageNavigation = (value) => A.assoc(keys.showPageNavigation, value)

export const expandedPageNavigation = getStateProp(keys.expandedPageNavigation, false)

export const setExpandedPageNavigation = (value) => A.assoc(keys.expandedPageNavigation, value)

// ============ Form nodeDef label Function
export const getNodeDefLabelType = getStateProp(keys.nodeDefLabelType, NodeDef.NodeDefLabelTypes.label)

export const setNodeDefLabelType = (value) => A.assoc(keys.nodeDefLabelType, value)

// ====== NodeDef update actions

// On nodeDef delete, dissoc nodeDefUuidPage and nodeDefUuidAddChildTo if they correspond to nodeDef
export const dissocParamsOnNodeDefDelete = (nodeDef) => (surveyFormState) => {
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  return A.pipe(
    A.ifElse(A.propEq(keys.nodeDefUuidPage, nodeDefUuid), A.dissoc(keys.nodeDefUuidPage), A.identity),
    A.ifElse(A.propEq(keys.nodeDefUuidAddChildTo, nodeDefUuid), A.dissoc(keys.nodeDefUuidAddChildTo), A.identity)
  )(surveyFormState)
}
