import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import Record from '../../../common/record/record'

import { getPageUuid } from '../../../common/survey/nodeDefLayout'

import * as RecordState from './record/recordState'
import * as SurveyState from '../../survey/surveyState'

export const getSurveyForm = R.prop('surveyForm')

const props = 'props'
/**
 * ======================
 * Survey-Form State
 * ======================
 */

// ====== current form page nodeDef

const pageNodeDefUuid = 'pageNodeDefUuid'
const formPagePath = [props, pageNodeDefUuid]

export const assocFormActivePage = (nodeDef) =>
  R.assoc(
    pageNodeDefUuid,
    nodeDef ? nodeDef.uuid : null
  )

export const getFormActivePageNodeDef = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyForm = getSurveyForm(state)

  return R.pipe(
    Survey.getNodeDefByUuid(R.path(formPagePath, surveyForm)),
    R.defaultTo(Survey.getRootNodeDef(survey))
  )(survey)
}

export const isNodeDefFormActivePage = nodeDef =>
  R.pipe(
    getFormActivePageNodeDef,
    R.propEq('uuid', NodeDef.getUuid(nodeDef))
  )

// ====== current nodeDef edit
const nodeDefEdit = 'nodeDefEdit'
const nodeDefEditPath = [props, nodeDefEdit]

export const assocFormNodeDefEdit = nodeDef =>
  R.assoc(nodeDefEdit, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefEdit = survey =>
  surveyForm => Survey.getNodeDefByUuid(
    R.path(nodeDefEditPath, surveyForm)
  )(survey)

// ====== nodeDef selected to add children to
const nodeDefAddChildTo = 'nodeDefAddChildTo'

export const assocNodeDefAddChildTo = nodeDef =>
  R.assoc(nodeDefAddChildTo, nodeDef ? nodeDef.uuid : null)

export const getNodeDefAddChildTo = state => {
  const survey = SurveyState.getSurvey(state)

  return R.pipe(
    getSurveyForm,
    R.path([props, nodeDefAddChildTo]),
    nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey)
  )(state)
}

// ====== current list of form pages

const pageNodes = 'pageNodes'

export const assocFormPageNode = (nodeDef, nodeUuid) => {
  const path = [pageNodes, nodeDef.uuid]
  return nodeUuid
    ? R.assocPath(path, nodeUuid)
    : R.dissocPath(path)
}

export const getFormPageNodeUuid = nodeDef => R.pipe(
  getSurveyForm,
  R.path([props, pageNodes, nodeDef.uuid])
)

export const getFormPageParentNode = nodeDef =>
  state => {
    const survey = SurveyState.getSurvey(state)
    const surveyForm = getSurveyForm(state)
    const record = RecordState.getRecord(surveyForm)

    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    if (nodeDefParent) {

      if (NodeDef.isNodeDefRoot(nodeDefParent)) {
        return Record.getRootNode(record)
      } else {
        const parentNodeUuid = getFormPageNodeUuid(nodeDefParent)(state)
        return Record.getNodeByUuid(parentNodeUuid)(record)
      }

    }

    return null
  }

// on nodeDef create
export const assocParamsOnNodeDefCreate = nodeDef => R.pipe(
  assocFormNodeDefEdit(nodeDef),
  // if is entity and renders in its own page, assoc active page
  R.ifElse(
    () => NodeDef.isNodeDefEntity(nodeDef) && !!getPageUuid(nodeDef),
    assocFormActivePage(nodeDef),
    R.identity,
  ),
  // if is entity remove assocNodeDefAddChildTo
  R.ifElse(
    () => NodeDef.isNodeDefEntity(nodeDef),
    assocNodeDefAddChildTo(null),
    R.identity,
  )
)