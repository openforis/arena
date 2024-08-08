import * as R from 'ramda'

import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import { TreeSelectViewMode } from '@webapp/model'
import { SurveyState } from '@webapp/store/survey'
import { RecordState } from '@webapp/store/ui/record'

import * as UiState from '../state'

export const stateKey = 'surveyForm'
const getState = R.pipe(UiState.getState, R.propOr({}, stateKey))
const getStateProp = (prop, defaultTo = null) => R.pipe(getState, R.propOr(defaultTo, prop))

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
export const getTreeSelectViewMode = R.propOr(TreeSelectViewMode.onlyPages, keys.treeSelectViewMode)
export const assocTreeSelectViewMode = R.assoc(keys.treeSelectViewMode)

export const getFormActiveNodeDefUuid = (state) =>
  getStateProp(keys.nodeDefUuid, NodeDef.getUuid(getFormActivePageNodeDef(state)))(state)
export const assocFormActiveNodeDefUuid = R.assoc(keys.nodeDefUuid)

// ====== nodeDefUuidPage

export const assocFormActivePage = (nodeDef) =>
  R.ifElse(
    R.always(R.isNil(nodeDef)),
    R.dissoc(keys.nodeDefUuidPage),
    R.assoc(keys.nodeDefUuidPage, NodeDef.getUuid(nodeDef))
  )

export const getFormActivePageNodeDef = (state) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidPage = getStateProp(keys.nodeDefUuidPage)(state)
  if (Objects.isEmpty(survey) || Objects.isEmpty(Survey.getNodeDefs(survey))) return null

  return nodeDefUuidPage ? Survey.getNodeDefByUuid(nodeDefUuidPage)(survey) : Survey.getNodeDefRoot(survey)
}

export const isNodeDefFormActivePage = (nodeDef) =>
  R.pipe(getFormActivePageNodeDef, R.propEq(NodeDef.keys.uuid, NodeDef.getUuid(nodeDef)))

// ====== nodeDefUuidAddChildTo

export const assocNodeDefAddChildTo = (nodeDef) => R.assoc(keys.nodeDefUuidAddChildTo, NodeDef.getUuid(nodeDef))

export const getNodeDefAddChildTo = (state) => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidAddChildTo = getStateProp(keys.nodeDefUuidAddChildTo)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidAddChildTo)(survey)
}

// ====== nodeDefUuidPageNodeUuid

export const assocFormPageNode = (nodeDefUuid, nodeUuid) => {
  const path = [keys.nodeDefUuidPageNodeUuid, nodeDefUuid]
  return nodeUuid ? R.assocPath(path, nodeUuid) : R.dissocPath(path)
}

export const assocFormPageNodes = (formPageNodeUuidByNodeDefUuid) => (state) =>
  R.pipe(
    R.keys,
    R.reduce((stateAcc, nodeDefUuid) => {
      const nodeUuid = R.prop(nodeDefUuid, formPageNodeUuidByNodeDefUuid)
      return assocFormPageNode(nodeDefUuid, nodeUuid)(stateAcc)
    }, state)
  )(formPageNodeUuidByNodeDefUuid)

export const getPagesUuidMap = getStateProp(keys.nodeDefUuidPageNodeUuid, {})

export const getFormPageNodeUuid = (nodeDef) => R.pipe(getPagesUuidMap, R.prop(NodeDef.getUuid(nodeDef)))

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
    return Record.getNodeByUuid(parentNodeUuid)(record)
  }

  return null
}

// ====== Page navigation

export const showPageNavigation = getStateProp(keys.showPageNavigation, true)

export const setShowPageNavigation = (value) => R.assoc(keys.showPageNavigation, value)

export const expandedPageNavigation = getStateProp(keys.expandedPageNavigation, false)

export const setExpandedPageNavigation = (value) => R.assoc(keys.expandedPageNavigation, value)

// ============ Form nodeDef label Function
export const getNodeDefLabelType = getStateProp(keys.nodeDefLabelType, NodeDef.NodeDefLabelTypes.label)

export const setNodeDefLabelType = (value) => R.assoc(keys.nodeDefLabelType, value)

// ====== NodeDef update actions

// On nodeDef delete, dissoc nodeDefUuidPage and nodeDefUuidAddChildTo if they correspond to nodeDef
export const dissocParamsOnNodeDefDelete = (nodeDef) => (surveyFormState) => {
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  return R.pipe(
    R.ifElse(R.propEq(keys.nodeDefUuidPage, nodeDefUuid), R.dissoc(keys.nodeDefUuidPage), R.identity),
    R.ifElse(R.propEq(keys.nodeDefUuidAddChildTo, nodeDefUuid), R.dissoc(keys.nodeDefUuidAddChildTo), R.identity)
  )(surveyFormState)
}
