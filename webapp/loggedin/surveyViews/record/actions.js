import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../../utils/reduxUtils'

import Survey from '../../../../common/survey/survey'
import NodeDefLayout from '../../../../common/survey/nodeDefLayout'
import Record from '../../../../common/record/record'
import Node from '../../../../common/record/node'
import NodeRefData from '../../../../common/record/nodeRefData'

import * as SurveyState from '../../../survey/surveyState'
import * as AppState from '../../../app/appState'
import * as RecordState from './recordState'

import { showAppLoader, hideAppLoader, showNotificationMessage } from '../../../app/actions'

import { appModules, appModuleUri, dataModules, designerModules } from '../../appModules'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const recordDelete = 'survey/record/delete'

export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'
export const validationsUpdate = 'survey/record/validation/update'

export const recordNodesUpdate = nodes => dispatch => {
  dispatch({ type: nodesUpdate, nodes })
  dispatch(hideAppLoader())
}

export const nodeValidationsUpdate = ({ recordUuid, recordValid, validations }) => dispatch =>
  dispatch({ type: validationsUpdate, recordUuid, recordValid, validations })

const _navigateToModuleDataHome = history =>
  history.push(appModuleUri(appModules.data))

export const recordDeleted = history => dispatch => {
  dispatch({ type: recordDelete })
  dispatch(showNotificationMessage('recordView.justDeleted'))
  _navigateToModuleDataHome(history)
}

export const sessionExpired = history => dispatch => {
  dispatch(showNotificationMessage('recordView.sessionExpired'))
  _navigateToModuleDataHome(history)
}

export const cycleChanged = history => () =>
  _navigateToModuleDataHome(history)

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = (history, preview = false) => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const state = getState()
  const user = AppState.getUser(state)
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const record = Record.newRecord(user, cycle, preview)

  await axios.post(`/api/survey/${surveyId}/record`, record)

  const moduleUri = appModuleUri(preview ? designerModules.recordPreview : dataModules.record)
  history.push(moduleUri + Record.getUuid(record))
}

export const createNodePlaceholder = (nodeDef, parentNode, defaultValue) =>
  dispatch => {
    const node = Node.newNodePlaceholder(nodeDef, parentNode, defaultValue)
    recordNodesUpdate({ [Node.getUuid(node)]: node })(dispatch)
  }
/**
 * ============
 * READ
 * ============
 */

/**
 * ============
 * UPDATE
 * ============
 */

export const updateNode = (nodeDef, node, value, file = null, meta = {}, refData = null) => dispatch => {

  const nodeToUpdate = R.pipe(
    R.dissoc(Node.keys.placeholder),
    Node.assocValue(value),
    Node.mergeMeta(meta),
    NodeRefData.assocRefData(refData),
    R.assoc(Node.keys.dirty, true),
  )(node)

  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate }))
  dispatch(_updateNodeDebounced(nodeToUpdate, file, Node.isPlaceholder(node) ? 0 : 500))
}

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    const formData = new FormData()
    formData.append('node', JSON.stringify(node))

    if (file)
      formData.append('file', file)

    const surveyId = SurveyState.getSurveyId(getState())
    await axios.post(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`, formData)
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

export const updateRecordStep = (step, history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/step`, { step })

  history.push(appModuleUri(appModules.data))
}

/**
 * ============
 * DELETE
 * ============
 */
export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch({ type: nodeDelete, node })

  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
}

export const deleteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

  dispatch(recordDeleted(history))
}

/**
 * ============
 * Check in / check out record
 * ============
 */
export const checkInRecord = (recordUuid, draft, entityUuid) => async (dispatch, getState) => {
  dispatch(showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const { data: { record } } = await axios.post(
    `/api/survey/${surveyId}/record/${recordUuid}/checkin`,
    { draft }
  )

  // this is used by dataQuery when user is editing a specific entity
  if (entityUuid) {

    const state = getState()
    const survey = SurveyState.getSurvey(state)

    // ancestors are needed to find the entity with a pageUuid specified
    const entity = Record.getNodeByUuid(entityUuid)(record)
    const ancestors = Record.getAncestorsAndSelf(entity)(record)

    const nodeDefActivePage = R.pipe(
      R.map(ancestor => Survey.getNodeDefByUuid(Node.getNodeDefUuid(ancestor))(survey)),
      R.find(R.pipe(
        NodeDefLayout.getPageUuid,
        R.isNil,
        R.not
      ))
    )(ancestors)

    // getting the nodes associated to the nodeDef page
    const formPageNodeUuidByNodeDefUuid = R.reduce(
      (acc, ancestor) => R.assoc(Node.getNodeDefUuid(ancestor), Node.getUuid(ancestor), acc),
      [],
      ancestors
    )

    dispatch({ type: recordLoad, record, nodeDefActivePage, formPageNodeUuidByNodeDefUuid })
  } else {
    dispatch({ type: recordLoad, record })
  }
}

export const checkOutRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  // checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId)
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
}
