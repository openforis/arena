import * as R from 'ramda'

import { getNodeDefByUUID, getNodeDefParent, getRootNodeDef } from '../../../common/survey/survey'

import { getRecord } from '../record/recordState'
import { getNodeByUUID } from '../../../common/record/record'

const form = 'form'
/**
 * ======================
 * Survey-Form State
 * ======================
 */

// ====== current form page nodeDef

const pageNodeDefUUID = 'pageNodeDefUUID'
const formPagePath = [form, pageNodeDefUUID]

export const assocFormActivePage = (nodeDef) =>
  R.assoc(
    pageNodeDefUUID,
    nodeDef ? nodeDef.uuid : null
  )

export const getFormActivePageNodeDef = survey => R.pipe(
  getNodeDefByUUID(R.path(formPagePath, survey)),
  R.defaultTo(getRootNodeDef(survey))
)(survey)

export const isNodeDefFormActivePage = nodeDef => R.pipe(
  getFormActivePageNodeDef,
  n => nodeDef.uuid === n.uuid
)

// ====== current nodeDef edit
const nodeDefEdit = 'nodeDefEdit'
const nodeDefEditPath = [form, nodeDefEdit]

export const assocFormNodeDefEdit = nodeDef =>
  R.assoc(nodeDefEdit, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefEdit = survey => getNodeDefByUUID(
  R.path(nodeDefEditPath, survey)
)(survey)

// ====== current unlocked nodeDef in form
const nodeDefUnlocked = 'nodeDefUnlocked'
const nodeDefEntityUnlockedPath = [form, nodeDefUnlocked]
export const assocNodeDefFormUnlocked = nodeDef =>
  R.assoc(nodeDefUnlocked, nodeDef ? nodeDef.uuid : null)

export const getNodeDefFormUnlocked = survey => getNodeDefByUUID(
  R.path(nodeDefEntityUnlockedPath, survey)
)(survey)

export const isNodeDefFormLocked = nodeDef => R.pipe(
  R.path(nodeDefEntityUnlockedPath),
  R.equals(nodeDef.uuid),
  R.not,
)

// ====== current list of form pages
const surveyFormPages = ['form', 'pageNodes']

const getSurveyFormPageNodePath = nodeDef => R.append(nodeDef.uuid, surveyFormPages)

export const assocFormPageNode = (nodeDef, nodeUUID) => {
  const path = getSurveyFormPageNodePath(nodeDef)
  return nodeUUID
    ? R.assocPath(path, nodeUUID)
    : R.dissocPath(path)
}

export const getFormPageNodeUUID = nodeDef =>
  R.path(getSurveyFormPageNodePath(nodeDef))

export const getFormPageParentNode = nodeDef =>
  survey => {
    const record = getRecord(survey)

    const nodeDefParent = getNodeDefParent(nodeDef)(survey)
    if (nodeDefParent) {
      const parentNodeUUID = R.path(getSurveyFormPageNodePath(nodeDefParent))(survey)

      return getNodeByUUID(parentNodeUUID)(record)
    }

    return null
  }
