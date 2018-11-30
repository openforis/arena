import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import Record from '../../../common/record/record'

import { getPageUUID } from '../../../common/survey/nodeDefLayout'
import { getRecord } from './record/recordState'

export const getSurveyForm = R.prop('surveyForm')

const props = 'props'
/**
 * ======================
 * Survey-Form State
 * ======================
 */

// ====== current form page nodeDef

const pageNodeDefUUID = 'pageNodeDefUUID'
const formPagePath = [props, pageNodeDefUUID]

export const assocFormActivePage = (nodeDef) =>
  R.assoc(
    pageNodeDefUUID,
    nodeDef ? nodeDef.uuid : null
  )

export const getFormActivePageNodeDef = survey =>
  surveyForm => R.pipe(
    Survey.getNodeDefByUUID(R.path(formPagePath, surveyForm)),
    R.defaultTo(Survey.getRootNodeDef(survey))
  )(survey)

export const isNodeDefFormActivePage = (survey, nodeDef) =>
  surveyForm => R.pipe(
    getFormActivePageNodeDef(survey),
    n => nodeDef.uuid === n.uuid
  )(surveyForm)

// ====== current nodeDef edit
const nodeDefEdit = 'nodeDefEdit'
const nodeDefEditPath = [props, nodeDefEdit]

export const assocFormNodeDefEdit = nodeDef =>
  R.assoc(nodeDefEdit, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefEdit = survey =>
  surveyForm => Survey.getNodeDefByUUID(
    R.path(nodeDefEditPath, surveyForm)
  )(survey)

// ====== current unlocked nodeDef in form
const nodeDefUnlocked = 'nodeDefUnlocked'
const nodeDefEntityUnlockedPath = [props, nodeDefUnlocked]

export const assocNodeDefFormUnlocked = nodeDef =>
  R.assoc(nodeDefUnlocked, nodeDef ? nodeDef.uuid : null)

export const getNodeDefFormUnlocked = survey =>
  surveyForm => Survey.getNodeDefByUUID(
    R.path(nodeDefEntityUnlockedPath, surveyForm)
  )(survey)

export const isNodeDefFormLocked = (nodeDef) => R.pipe(
  R.path(nodeDefEntityUnlockedPath),
  R.equals(nodeDef.uuid),
  R.not,
)

// ====== current list of form pages

const pageNodes = 'pageNodes'
const getSurveyFormPageNodePath = nodeDef => [props, pageNodes, nodeDef.uuid]

export const assocFormPageNode = (nodeDef, nodeUUID) => {
  const path = [pageNodes, nodeDef.uuid]
  return nodeUUID
    ? R.assocPath(path, nodeUUID)
    : R.dissocPath(path)
}

export const getFormPageNodeUUID = nodeDef =>
  R.path(getSurveyFormPageNodePath(nodeDef))

export const getFormPageParentNode = (survey, nodeDef) =>
  surveyForm => {
    const record = getRecord(surveyForm)

    const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
    if (nodeDefParent) {

      if (NodeDef.isNodeDefRoot(nodeDefParent)) {
        return Record.getRootNode(record)
      } else {
        const parentNodeUUID = R.path(getSurveyFormPageNodePath(nodeDefParent))(surveyForm)
        const node = Record.getNodeByUuid(parentNodeUUID)(record)
        return node
      }

    }

    return null
  }

// on nodeDef create
export const assocParamsOnNodeDefCreate = nodeDef => R.pipe(
  assocFormNodeDefEdit(nodeDef),
  R.ifElse(
    () => NodeDef.isNodeDefEntity(nodeDef),

    // if is entity, unlock form
    R.pipe(
      assocNodeDefFormUnlocked(nodeDef),
      // if entity renders in its own page, assoc active page
      R.ifElse(
        () => !!getPageUUID(nodeDef),
        assocFormActivePage(nodeDef),
        R.identity
      )
    ),

    R.identity
  )
)