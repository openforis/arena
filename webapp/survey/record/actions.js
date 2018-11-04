import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import Survey from '../../../common/survey/survey'
import { getStateSurveyId, getSurvey } from '../surveyState'
import { getUser } from '../../app/appState'
import { getRecord } from './recordState'

import { newRecord, getParentNode } from '../../../common/record/record'
import { newNodePlaceholder } from '../../../common/record/node'

export const recordCreate = 'survey/record/create'
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
    const survey = getSurvey(state)
    const surveyId = getStateSurveyId(state)
    const step = Survey.getSurveyDefaultStep(survey)

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
 * UPDATE
 * ============
 */

export const updateNode = (nodeDef, node, value, file = null) =>
  async (dispatch, getState) => {

    const state = getState()
    const survey = getSurvey(state)
    const surveyId = getStateSurveyId(state)
    const record = getRecord(survey)
    const parentNode = getParentNode(node)(record)

    // first update state
    const parentNodeToUpdate = parentNode.placeholder ? getUpdatedNode(dispatch, parentNode, null) : null
    const nodeToUpdate = getUpdatedNode(dispatch, node, value)

    const nodes = parentNodeToUpdate
      ? {[node.uuid]: nodeToUpdate, [parentNodeToUpdate.uuid]: parentNodeToUpdate}
      : {[node.uuid]: nodeToUpdate}

    dispatchNodesUpdate(dispatch, nodes)

    // then post nodes
    if (parentNodeToUpdate) {
      const {data} = await axios.post(`/api/survey/${surveyId}/record/${parentNodeToUpdate.recordId}/node`, parentNodeToUpdate)
      dispatchNodesUpdate(dispatch, data.nodes)
    }

    dispatch(_updateNodeDebounced(surveyId, nodeToUpdate, file, node.placeholder ? 0 : 500))
  }

const getUpdatedNode = (dispatch, node, value) =>
  R.pipe(
    R.dissoc('placeholder'),
    R.assoc('value', value),
  )(node)

const _updateNodeDebounced = (surveyId, node, file, delay) => {
  const action = async dispatch => {
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
