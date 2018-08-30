import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import { getCurrentSurvey } from '../surveyState'
import { getSurveyDefaultStep } from '../../../common/survey/survey'
import { appState } from '../../app/app'

import { newRecord, newNode } from '../../../common/record/record'

export const recordUpdate = 'survey/record/update'
export const nodesUpdate = 'survey/record/node/update'

export const nodeDeleted = 'record/nodeDeleted'

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = () => async (dispatch, getState) => {
  try {
    const state = getState()

    const user = appState.getUser(state)
    const survey = getCurrentSurvey(state)
    const step = getSurveyDefaultStep(survey)

    const record = newRecord(user, survey.id, step)
    dispatch({type: recordUpdate, record})

    const {data} = await axios.post(`/api/survey/${survey.id}/record`, record)
    dispatch({type: recordUpdate, record: data.record})

  } catch (e) {
    console.log(e)
  }
}

export const addNode = (nodeDef, parentNode, value) => dispatch => {
  const node = newNode(nodeDef.id, parentNode.recordId, parentNode.id, value)
  dispatch({type: nodesUpdate, nodes: {[node.uuid]: node}})
  dispatch(_addNode(nodeDef, node))
}

const _addNode = (nodeDef, node) => {
  const action = async dispatch => {
    try {
      const {data} = await axios.post(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node`, node)
      dispatch({type: nodesUpdate, nodes: data.nodes})
    } catch (e) {
      console.log(e)
    }
  }
  return debounceAction(action, `node_add_${node.uuid}`)
}

/**
 * ============
 * UPDATE
 * ============
 */
export const updateNodeValue = (nodeDef, node, value) => dispatch => {
  dispatch({type: nodesUpdate, nodes: {[node.uuid]: R.assoc('value', value, node)}})
  dispatch(_updateNodeValue(nodeDef, node, value))
}

const _updateNodeValue = (nodeDef, node, value) => {
  const action = async dispatch => {
    try {
      const {data} = await axios.put(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node/${node.id}`, {value})
      dispatch({type: nodesUpdate, nodes: data.nodes})
    } catch (e) {
      console.log(e)
    }
  }
  return debounceAction(action, `node_update_${node.uuid}`)
}

/**
 * ============
 * DELETE
 * ============
 */
export const removeNode = (nodeDef, node) => dispatch => {
  dispatch({type: nodesUpdate, nodes: {[node.uuid]: R.assoc('deleted', true)(node)}})
  dispatch(_removeNode(nodeDef, node))
}

const _removeNode = (nodeDef, node) => {
  const action = async dispatch => {
    try {
      const {data} = await axios.delete(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node/${node.id}`, node)
      dispatch({type: nodesUpdate, nodes: data.nodes})
    } catch (e) {
      console.log(e)
    }
  }
  return debounceAction(action, `node_remove_${node.uuid}`)
}