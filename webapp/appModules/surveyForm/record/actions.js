import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../../appUtils/reduxUtils'

import Survey from '../../../../common/survey/survey'
import Record from '../../../../common/record/record'
import Node from '../../../../common/record/node'

import { getStateSurveyId, getStateSurveyInfo } from '../../../survey/surveyState'
import { getUser } from '../../../app/appState'
import { getRecord } from './recordState'
import { getSurveyForm } from '../surveyFormState'

import { appModules, appModuleUri } from '../../appModules'
import { dataModules } from '../../data/dataModules'
import { designerModules } from '../../designer/designerModules'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const recordDelete = 'survey/record/delete'

export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'

export const recordNodesUpdate = nodes =>
  dispatch =>
    dispatch({ type: nodesUpdate, nodes })

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = (history, preview = false) => async (dispatch, getState) => {
  const state = getState()
  const user = getUser(state)
  const surveyInfo = getStateSurveyInfo(state)

  const record = Record.newRecord(user, Survey.getDefaultStep(surveyInfo), preview)

  await axios.post(`/api/survey/${surveyInfo.id}/record`, record)

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
    R.dissoc('placeholder'),
    R.assoc('value', value),
  )(node)

  recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate })(dispatch)
  dispatch(_updateNodeDebounced(nodeToUpdate, file, node.placeholder ? 0 : 500))
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

    const surveyId = getStateSurveyId(getState())
    await axios.post(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`, formData, config)
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

// TODO
export const demoteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = getStateSurveyId(state)
  const record = getRecord(getSurveyForm(state))
  const recordUuid = Record.getUuid(record)

  const step = +Record.getStep(record)

  const formData = new FormData()
  formData.append('step', step - 1)
  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/updateStep`, formData)

  history.push(appModuleUri(appModules.data))
}

export const promoteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = getStateSurveyId(state)
  const record = getRecord(getSurveyForm(state))
  const recordUuid = Record.getUuid(record)

  const step = +Record.getStep(record)

  const formData = new FormData()
  formData.append('step', step + 1)
  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/updateStep`, formData)

  history.push(appModuleUri(appModules.data))
}

/**
 * ============
 * DELETE
 * ============
 */
export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch({ type: nodeDelete, node })

  const surveyId = getStateSurveyId(getState())
  const { data } = await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
  recordNodesUpdate(data.nodes)(dispatch)
}

export const deleteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = getStateSurveyId(state)
  const record = getRecord(getSurveyForm(state))
  const recordUuid = Record.getUuid(record)

  // 1. checkout (close server thread)
  await checkOutRecord(recordUuid)(dispatch, getState)
  // 2. perform server side delete
  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)
  // 3. remove record from redux state
  await dispatch({ type: recordDelete })
  // 4. redirect to default data module (records view)
  history.push(appModuleUri(appModules.data))
}

/**
 * ============
 * Check in / check out record
 * ============
 */
export const checkInRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const { data } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkin`)
  dispatch({ type: recordLoad, record: data.record })
}

export const checkOutRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  // checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId)
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
}
