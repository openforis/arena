import * as R from 'ramda'
import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import { getSurvey } from '../surveyState'
import { getSurveyDefaultStep } from '../../../common/survey/survey'
import { appState } from '../../app/app'

import { newRecord } from '../../../common/record/record'
import { isNodeValueNotBlank } from '../../../common/record/node'

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
    //dispatch({type: recordUpdate, record})

    const {data} = await axios.post(`/api/survey/${survey.id}/record`, record)
    dispatch({type: recordUpdate, record: data.record})

  } catch (e) {
    console.log(e)
  }
}

export const updateNode = (nodeDef, node, value, parentNode) => async dispatch => {
  if (node.placeholder) {
    if (isNodeValueNotBlank(value)) {
      dispatch(addNode(nodeDef, node, value, parentNode))
    }
  } else {
    dispatch(updateNodeValue(nodeDef, node, value))
  }
}

const addNode = (nodeDef, node, value, parentNode = null) => async dispatch => {
  try {
    //TODO REFACTOR
    // add parent if not exist
    let addedParentNode = null
    if (parentNode && parentNode.placeholder) {
      const {data} = await axios.post(`/api/survey/${nodeDef.surveyId}/record/${parentNode.recordId}/node`, parentNode)
      addedParentNode = R.path(['nodes', parentNode.uuid], data)
    }

    const nodeToAdd = R.pipe(
      R.dissoc('placeholder'),
      R.assoc('value', value),
      R.assoc('parentId', addedParentNode ? addedParentNode.id : node.parentId),
    )(node)

    const addedNodes = addedParentNode
      ? {[nodeToAdd.uuid]: nodeToAdd, [addedParentNode.uuid]: addedParentNode}
      : {[nodeToAdd.uuid]: nodeToAdd}

    dispatchNodesUpdate(dispatch, addedNodes)

    const {data} = await axios.post(`/api/survey/${nodeDef.surveyId}/record/${nodeToAdd.recordId}/node`, nodeToAdd)
    dispatchNodesUpdate(dispatch, data.nodes)
  } catch (e) {
    console.log(e)
  }
}

/**
 * ============
 * UPDATE
 * ============
 */
const updateNodeValue = (nodeDef, node, value) => dispatch => {
  dispatchNodesUpdate(dispatch, {[node.uuid]: R.assoc('value', value, node)})
  dispatch(_updateNodeValue(nodeDef, node, value))
}

const _updateNodeValue = (nodeDef, node, value) => {
  const action = async dispatch => {
    try {
      const {data} = await axios.put(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node/${node.id}`, {value})
      dispatchNodesUpdate(dispatch, data.nodes)
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
export const removeNode = (nodeDef, node) => async dispatch => {
  try {
    dispatch({type: nodeDelete, node})

    const {data} = await axios.delete(`/api/survey/${nodeDef.surveyId}/record/${node.recordId}/node/${node.id}`, node)
    dispatch({type: nodesUpdate, nodes: data.nodes})
  } catch (e) {
    console.log(e)
  }
}