import * as R from 'ramda'

import * as  SurveyViewsState from '../surveyViewsState'

import Survey from '../../../../common/survey/survey'
import NodeDef from '../../../../common/survey/nodeDef'
import Record from '../../../../common/record/record'
import NodeDefLayout from '../../../../common/survey/nodeDefLayout'

import * as RecordState from '../record/recordState'
import * as SurveyState from '../../../survey/surveyState'

export const getSurveyForm = R.prop('surveyViews')

const getState = R.pipe(SurveyViewsState.getState, R.prop('surveyForm'))

const getStateProp = prop => R.pipe(getState, R.prop(prop))

const keys = {
  nodeDefUuidPage: 'nodeDefUuidPage', // current page nodeDef
  nodeDefUuidEdit: 'nodeDefUuidEdit', // current nodeDef edit
  nodeDefUuidAddChildTo: 'nodeDefUuidAddChildTo', // nodeDef (entity) selected to add children to
  nodeDefUuidPageNodeUuid: 'nodeDefUuidPageNodeUuid', // map of nodeDefUuid -> nodeUuid representing the node loaded in page nodeDefUuid
}

// ====== nodeDefUuidPage

export const assocFormActivePage = (nodeDef) => R.assoc(keys.nodeDefUuidPage, NodeDef.getUuid(nodeDef))

export const getFormActivePageNodeDef = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidPage = getStateProp(keys.nodeDefUuidPage)(state)

  return nodeDefUuidPage
    ? Survey.getNodeDefByUuid(nodeDefUuidPage)(survey)
    : Survey.getRootNodeDef(survey)

}

export const isNodeDefFormActivePage = nodeDef =>
  R.pipe(
    getFormActivePageNodeDef,
    R.propEq(NodeDef.keys.uuid, NodeDef.getUuid(nodeDef))
  )

// ====== nodeDefUuidEdit

export const assocFormNodeDefEdit = nodeDef => R.assoc(keys.nodeDefUuidEdit, NodeDef.getUuid(nodeDef))

export const getFormNodeDefEdit = state => {
  const survey = SurveyState.getSurvey(state)
  const nodeDefUuidEdit = getStateProp(keys.nodeDefUuidEdit)(state)

  return Survey.getNodeDefByUuid(nodeDefUuidEdit)(survey)
}

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

export const getFormPageNodeUuid = nodeDef => R.pipe(
  getStateProp(keys.nodeDefUuidPageNodeUuid),
  R.prop(NodeDef.getUuid(nodeDef))
)

export const getFormPageParentNode = nodeDef =>
  state => {
    const survey = SurveyState.getSurvey(state)
    const surveyViewsState = SurveyViewsState.getState(state)
    const record = RecordState.getRecord(surveyViewsState)

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

// on nodeDef create init form state
export const assocParamsOnNodeDefCreate = nodeDef => R.pipe(
  assocFormNodeDefEdit(nodeDef),
  // if is entity and renders in its own page, assoc active page
  R.ifElse(
    () => NodeDef.isEntity(nodeDef) && !!NodeDefLayout.getPageUuid(nodeDef),
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
