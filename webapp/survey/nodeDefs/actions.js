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

  const {data} = await axios.post(`/api/nodeDef`, nodeDef)
  dispatch({type: nodeDefUpdate, ...data})
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value) => async (dispatch, getState) => {
  dispatch({type: nodeDefPropUpdate, nodeDefUUID: nodeDef.uuid, key, value})
  dispatch(_putNodeDefProp(nodeDef, key, value))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch) => {
  dispatch({type: nodeDefDelete, nodeDef})

  await axios.delete(`/api/nodeDef/${nodeDef.id}`)
}

const _putNodeDefProp = (nodeDef, key, value) => {
  const action = async dispatch => {
    const {data} = await axios.put(`/api/nodeDef/${nodeDef.id}/prop`, {key, value})

    //update node defs with their validation status
    const {nodeDefs} = data
    dispatch({type: nodeDefsLoad, nodeDefs})
  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

