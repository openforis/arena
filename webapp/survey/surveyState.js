import * as R from 'ramda'

import { getNodeDefByUUID } from '../../common/survey/survey'
import { getNodeByUUID } from '../../common/record/record'
import { getRecord } from './record/recordState'

const survey = 'survey'

/**
 * ======================
 * Survey State
 * ======================
 */

// READ
export const getSurvey = R.prop(survey)

export const getSurveyId = R.pipe(
  getSurvey,
  R.prop('id'),
)

export const getNewSurvey = R.pipe(
  R.path([survey, 'newSurvey']),
  R.defaultTo({name: '', label: '', lang: 'en', validation: {}})
)

/**
 * ======================
 * Survey-Form State
 * ======================
 */

//SURVEY FORM ACTIVE PAGE

const surveyFormActivePage = ['form', 'activePageNodeDefUUID']

export const assocFormActivePage = (nodeDef) =>
  R.assocPath(
    surveyFormActivePage,
    nodeDef ? nodeDef.uuid : null
  )

export const getFormActivePageNodeDef = R.pipe(
  getSurvey,
  survey => getNodeDefByUUID(
    R.path(surveyFormActivePage, survey)
  )(survey)
)

export const isNodeDefFormActivePage = nodeDef =>
  R.pathEq(surveyFormActivePage, nodeDef.uuid)

// SURVEY FORM PAGES NODES SELECTED STATE
const surveyFormPages = ['form', 'pagesNodes']

export const getFormActivePageParentNode = state => {
  const survey = getSurvey(state)
  const record = getRecord(survey)
  const uuid = R.path(R.concat(surveyFormPages, ['parentNodeUUID']), survey)
  return getNodeByUUID(uuid)(record)
}

export const getFormActivePageNode = state => {
  const survey = getSurvey(state)
  const record = getRecord(survey)
  const uuid = R.path(R.concat(surveyFormPages, ['nodeUUID']), survey)
  return getNodeByUUID(uuid)(record)
}

// CURRENT EDITING NODE_DEF
const nodeDefEditPath = ['form', 'nodeDefEdit']
export const assocFormNodeDefEdit = nodeDef =>
  R.assocPath(nodeDefEditPath, nodeDef ? nodeDef.uuid : null)

export const getFormNodeDefEdit = state => {
  const surveyState = getSurvey(state)
  const uuid = R.path(nodeDefEditPath, surveyState)
  return getNodeDefByUUID(uuid)(surveyState)
}

// CURRENT UNLOCKED NODE_DEF ENTITY
const nodeDefEntityUnlockedPath = ['form', 'nodeDefUnlocked']
export const assocNodeDefFormUnlocked = nodeDef =>
  R.assocPath(nodeDefEntityUnlockedPath, nodeDef ? nodeDef.uuid : null)

export const getNodeDefFormUnlocked = state => {
  const surveyState = getSurvey(state)
  const uuid = R.path(nodeDefEntityUnlockedPath, surveyState)
  return getNodeDefByUUID(uuid)(surveyState)
}

export const isNodeDefFormLocked = nodeDef => R.pipe(
  getSurvey,
  R.path(nodeDefEntityUnlockedPath),
  R.equals(nodeDef.uuid),
  R.not,
)
