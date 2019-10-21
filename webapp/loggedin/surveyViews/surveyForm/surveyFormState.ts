import * as R from 'ramda'

import Survey from '../../../../core/survey/survey'
import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef'
import Record from '../../../../core/record/record'
import NodeDefLayout from '../../../../core/survey/nodeDefLayout'

import * as SurveyViewsState from '../surveyViewsState'
import * as RecordState from '../record/recordState'
import * as SurveyState from '../../../survey/surveyState'

export const stateKey = 'surveyForm'
const getState: (x: any) => any = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp: (prop: any, defaultTo?: any) => (x: any) => any
= (prop, defaultTo = null) => R.pipe(getState, R.propOr(defaultTo, prop))

const keys = {
  nodeDefUuidPage: 'nodeDefUuidPage', // current page nodeDef
  nodeDefUuidAddChildTo: 'nodeDefUuidAddChildTo', // nodeDef (entity) selected to add children to
  nodeDefUuidPageNodeUuid: 'nodeDefUuidPageNodeUuid', // map of nodeDefUuid -> nodeUuid representing the node loaded in page nodeDefUuid
  showPageNavigation: 'showPageNavigation',
}

// ====== nodeDefUuidPage

export const assocFormActivePage = (nodeDef) => R.assoc(keys.nodeDefUuidPage, NodeDef.getUuid(nodeDef))

export const getFormActivePageNodeDef = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidPage = getStateProp(keys.nodeDefUuidPage)(state)

  return nodeDefUuidPage
    ? Survey.getNodeDefByUuid(nodeDefUuidPage)(survey)
    : Survey.getNodeDefRoot(survey)

}

export const isNodeDefFormActivePage = nodeDef =>
  R.pipe(
    getFormActivePageNodeDef,
    R.propEq(NodeDef.keys.uuid, NodeDef.getUuid(nodeDef))
  )

// ====== nodeDefUuidAddChildTo

export const assocNodeDefAddChildTo = nodeDef => R.assoc(keys.nodeDefUuidAddChildTo, NodeDef.getUuid(nodeDef))

export const getNodeDefAddChildTo = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidAddChildTo = getStateProp(keys.nodeDefUuidAddChildTo)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidAddChildTo)(survey)
}

// ====== nodeDefUuidPageNodeUuid

export const assocFormPageNode = (nodeDefUuid, nodeUuid) => {
  const path = [keys.nodeDefUuidPageNodeUuid, nodeDefUuid]
  return nodeUuid
    ? R.assocPath(path, nodeUuid)
    : R.dissocPath(path)
}

export const assocFormPageNodes = formPageNodeUuidByNodeDefUuid => state =>
  R.pipe(
    R.keys,
    R.reduce(
      (stateAcc, nodeDefUuid) => {
        const nodeUuid = R.prop(nodeDefUuid, formPageNodeUuidByNodeDefUuid)
        return assocFormPageNode(nodeDefUuid, nodeUuid)(stateAcc)
      },
      state
    )
  )(formPageNodeUuidByNodeDefUuid)

export const getFormPageNodeUuid: (nodeDef: INodeDef) => (x: any) => any
= nodeDef => R.pipe(
  getStateProp(keys.nodeDefUuidPageNodeUuid),
  R.prop(NodeDef.getUuid(nodeDef))
)

export const getFormPageParentNode = nodeDef =>
  state => {
    const survey = SurveyState.getSurvey(state)
    const record = RecordState.getRecord(state)

    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    if (nodeDefParent) {

      if (NodeDef.isRoot(nodeDefParent)) {
        return Record.getRootNode(record)
      } else {
        const parentNodeUuid = getFormPageNodeUuid(nodeDefParent)(state)
        return Record.getNodeByUuid(parentNodeUuid)(record)
      }

    }

    return null
  }

// ====== Page navigation

export const showPageNavigation: (x: any) => any = getStateProp(keys.showPageNavigation, true)

export const setShowPageNavigation = showPageNavigation => R.assoc(keys.showPageNavigation, showPageNavigation)

// ====== NodeDef update actions

// on nodeDef create init form state
export const assocParamsOnNodeDefCreate = nodeDef => R.pipe(
  // if is entity and renders in its own page, assoc active page
  R.ifElse(
    () => NodeDef.isEntity(nodeDef) && NodeDefLayout.hasPage(NodeDef.getCycleFirst(nodeDef))(nodeDef),
    assocFormActivePage(nodeDef),
    R.identity,
  ),
  // if is entity remove assocNodeDefAddChildTo
  R.ifElse(
    () => NodeDef.isEntity(nodeDef),
    assocNodeDefAddChildTo(null),
    R.identity,
  )
)

// on nodeDef delete, dissoc nodeDefUuidPage and nodeDefUuidAddChildTo if they correspond to nodeDef
export const dissocParamsOnNodeDefDelete = nodeDef => surveyFormState => {
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  return R.pipe(
    R.ifElse(
      R.propEq(keys.nodeDefUuidPage, nodeDefUuid),
      R.dissoc(keys.nodeDefUuidPage),
      R.identity
    ),
    R.ifElse(
      R.propEq(keys.nodeDefUuidAddChildTo, nodeDefUuid),
      R.dissoc(keys.nodeDefUuidAddChildTo),
      R.identity
    ),
  )(surveyFormState)
}
