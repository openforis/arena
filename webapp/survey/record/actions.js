import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import { getSurvey } from '../surveyState'
import { getSurveyDefaultStep } from '../../../common/survey/survey'
import { appState } from '../../app/app'

import { newRecord, getParentNode } from '../../../common/record/record'
import { newNodePlaceholder } from '../../../common/record/node'

import { getRecord } from './recordState'

export const recordUpdate = 'survey/record/update'
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

    const user = appState.getUser(state)
    const survey = getSurvey(state)
    const step = getSurveyDefaultStep(survey)

    const record = newRecord(user, survey.id, step)

    const {data} = await axios.post(`/api/survey/${survey.id}/record`, record)
    dispatch({type: recordUpdate, record: data.record})

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
 * UPDATE
 * ============
 */

export const updateNode = (nodeDef, node, value) =>
  async (dispatch, getState) => {
    // new node, update value

    const survey = getSurvey(getState())
    const record = getRecord(survey)
    const parentNode = getParentNode(node)(record)

    // first update state
    const parentNodeToUpdate = parentNode.placeholder ? getUpdatedNode(dispatch, parentNode, null) : null
    const nodeToUpdate = getUpdatedNode(dispatch, node, value)

    dispatchNodesUpdate(
      dispatch,
      parentNodeToUpdate
        ? {[node.uuid]: nodeToUpdate, [parentNodeToUpdate.uuid]: parentNodeToUpdate}
        : {[node.uuid]: nodeToUpdate}
    )

    // then post nodes
    if (parentNodeToUpdate) {
      const {data} = await axios.post(`/api/survey/${survey.id}/record/${parentNodeToUpdate.recordId}/node`, parentNodeToUpdate)
      dispatchNodesUpdate(dispatch, data.nodes)
    }

    dispatch(_updateNodeDebounced(survey.id, nodeToUpdate, node.placeholder ? 0 : 500))
  }

const getUpdatedNode = (dispatch, node, value) =>
  R.pipe(
    R.dissoc('placeholder'),
    R.assoc('value', value),
  )(node)

const _updateNodeDebounced = (surveyId, node, delay) => {
  const action = async dispatch => {
    try {
      const {data} = await axios.post(`/api/survey/${surveyId}/record/${node.recordId}/node`, node)
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