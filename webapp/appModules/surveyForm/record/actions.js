import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../../appUtils/reduxUtils'

import Survey from '../../../../common/survey/survey'
import { getStateSurveyId, getStateSurveyInfo } from '../../../survey/surveyState'
import { getUser } from '../../../app/appState'

import { newRecord } from '../../../../common/record/record'
import { newNodePlaceholder } from '../../../../common/record/node'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'

const dispatchNodesUpdate = (dispatch, nodes) => dispatch({type: nodesUpdate, nodes})

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = () => async (dispatch, getState) => {
  try {
    const state = getState()

    const user = getUser(state)
    const surveyId = getStateSurveyId(state)
    const surveyInfo = getStateSurveyInfo(state)
    const step = Survey.getDefaultStep(surveyInfo)

    const record = newRecord(user, surveyId, step)

    const {data} = await axios.post(`/api/survey/${surveyId}/record`, record)
    dispatch({type: recordCreate, record: data.record})

  } catch (e) {
    console.log(e)
  }
}

export const createNodePlaceholder = (nodeDef, parentNode, defaultValue) =>
  dispatch => {
    const node = newNodePlaceholder(nodeDef, parentNode, defaultValue)
    dispatchNodesUpdate(dispatch, {[node.uuid]: node})
  }
/**
 * ============
 * READ
 * ============
 */
export const fetchRecord = recordId => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const {data} = await axios.get(`/api/survey/${surveyId}/record/${recordId}`)
  dispatch({type: recordLoad, record: data.record})
}
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

  dispatchNodesUpdate(dispatch, {[node.uuid]: nodeToUpdate})
  dispatch(_updateNodeDebounced(nodeToUpdate, file, node.placeholder ? 0 : 500))
}

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    try {
      const formData = new FormData()
      formData.append('node', JSON.stringify(node))

      if (file)
        formData.append('file', file)

      const config = file
        ? {
          headers: {
            'content-type': 'multipart/form-data'
          }
        }
        : {}

      const surveyId = getStateSurveyId(getState())
      const {data} = await axios.post(`/api/survey/${surveyId}/record/${node.recordId}/node`, formData, config)
      dispatchNodesUpdate(dispatch, data.nodes)
    } catch (e) {
      console.log(e)
    }
  }
  return debounceAction(action, `node_update_${node.uuid}`, delay)
}

/**
 * ============
 * DELETE
 * ============
 */
export const removeNode = (nodeDef, node) => async dispatch => {
  try {
    dispatch({type: nodeDelete, node})

    const {data} = await axios.delete(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node/${node.uuid}`)
    dispatchNodesUpdate(dispatch, data.nodes)
  } catch (e) {
    console.log(e)
  }
}
