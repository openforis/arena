import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../../appUtils/reduxUtils'

import Record from '../../../../common/record/record'
import Node from '../../../../common/record/node'

import * as SurveyState from '../../../survey/surveyState'
import * as AppState from '../../../app/appState'
import * as RecordState from './recordState'

import { appModules, appModuleUri } from '../../appModules'
import { dataModules } from '../../data/dataModules'
import { designerModules } from '../../designer/designerModules'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const recordDelete = 'survey/record/delete'

export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'
export const validationsUpdate = 'survey/record/validation/update'

export const recordNodesUpdate = nodes =>
  dispatch =>
    dispatch({ type: nodesUpdate, nodes })

export const nodeValidationsUpdate = validations =>
  dispatch =>
    dispatch({ type: validationsUpdate, validations })

export const dispatchRecordDelete = (history) =>
  dispatch => {
    dispatch({ type: recordDelete })
    history.push(appModuleUri(appModules.data))
  }

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = (history, preview = false) => async (dispatch, getState) => {
  const state = getState()
  const user = AppState.getUser(state)
  const surveyId = SurveyState.getStateSurveyId(state)

  const record = Record.newRecord(user, preview)

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

export const updateNode = (nodeDef, node, value, file = null) => dispatch => {

  const nodeToUpdate = R.pipe(
    R.dissoc(Node.keys.placeholder),
    R.assoc(Node.keys.value, value),
  )(node)

  recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate })(dispatch)
  dispatch(_updateNodeDebounced(nodeToUpdate, file, Node.isPlaceholder(node) ? 0 : 500))
}

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    const formData = new FormData()
    formData.append('node', JSON.stringify(node))

    if (file)
      formData.append('file', file)

    const config = file
      ? { headers: { 'content-type': 'multipart/form-data' } }
      : {}

    const surveyId = SurveyState.getStateSurveyId(getState())
    await axios.post(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`, formData, config)
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

export const updateRecordStep = (step, history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getStateSurveyId(state)
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

  const surveyId = SurveyState.getStateSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
  recordNodesUpdate(data.nodes)(dispatch)
}

export const deleteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getStateSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  // 1. checkout (close server thread)
  await checkOutRecord(recordUuid)(dispatch, getState)
  // 2. perform server side delete
  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)
  // 3. remove record from redux state and redirect to records view
  dispatchRecordDelete(history)(dispatch)
}

/**
 * ============
 * Check in / check out record
 * ============
 */
export const checkInRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getStateSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkin`)
  dispatch({ type: recordLoad, record: data.record })
}

export const checkOutRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getStateSurveyId(getState())
  // checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId)
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
}
