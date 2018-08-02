import axios from 'axios'

import { newNodeDef, nodeDefType } from '../../common/survey/nodeDef'
import { getCurrentSurveyId } from './surveyState'

export const nodeDefsFetch = 'nodeDefs/fetch'
export const nodeDefUpdate = 'nodeDef/update'

// ==== CREATE

export const createNodeDef = (parentId, type, props) => async (dispatch, getState) => {
  try {
    const surveyId = getCurrentSurveyId(getState())
    const nodeDef = newNodeDef(surveyId, parentId, type, props)
    dispatch({type: nodeDefUpdate, nodeDef})

    const {data} = await axios.post(`/api/nodeDef`, nodeDef)
    dispatch({type: nodeDefUpdate, ...data})
  } catch (e) { }
}

export const createAttributeDef = (parentId, props) => async dispatch =>
  dispatch(createNodeDef(parentId, nodeDefType.attribute, props))

export const createEntityDef = (parentId, props) => async dispatch =>
  dispatch(createNodeDef(parentId, nodeDefType.entity, props))

// ==== READ

export const fetchNodeDef = (id, draft = false) => async dispatch => {
  try {
    const {data} = await axios.get(`/api/nodeDef/${id}?draft=${draft}`)
    dispatch({type: nodeDefsFetch, ...data})

  } catch (e) { }

}

