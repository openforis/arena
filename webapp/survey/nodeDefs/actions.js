import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import NodeDef from '../../../common/survey/nodeDef'
import { getStateSurveyId } from '../surveyState'

export const nodeDefsLoad = 'nodeDefs/load'

export const nodeDefCreate = 'nodeDef/create'
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefDelete = 'nodeDef/delete'

// ==== CREATE

export const createNodeDef = (parentId, type, props) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const nodeDef = NodeDef.newNodeDef(surveyId, parentId, type, props)

  dispatch({type: nodeDefCreate, nodeDef})

  const {data} = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({type: nodeDefUpdate, ...data})
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value) => async (dispatch) => {
  dispatch({type: nodeDefPropUpdate, nodeDefUUID: nodeDef.uuid, key, value})

  const {surveyId} = nodeDef
  dispatch(_putNodeDefProp(nodeDef, surveyId, key, value))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch) => {
  dispatch({type: nodeDefDelete, nodeDef})

  const {surveyId} = nodeDef
  await axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDef.id}`)
}

const _putNodeDefProp = (nodeDef, surveyId, key, value) => {
  const action = async dispatch => {
    const {data} = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDef.id}/prop`, {key, value})

    //update node defs with their validation status
    const {nodeDefs} = data
    dispatch({type: nodeDefsLoad, nodeDefs})
  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

