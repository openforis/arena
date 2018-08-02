import axios from 'axios'

import { newNodeDef, nodeDefType } from '../../common/survey/nodeDef'
import { getCurrentSurveyId } from './surveyState'

export const nodeDefUpdate = 'nodeDef/update'

// ==== CREATE

export const createNodeDef = (parentId, type, props) => async (dispatch, getState) => {
  try {

    const surveyId = getCurrentSurveyId(getState())
    const nodeDef = newNodeDef(surveyId, parentId, type, props)
    dispatch({type: nodeDefUpdate, nodeDef})

    await axios.post(`/api/nodeDef`, nodeDef)

  } catch (e) {

  }
}

export const createAttributeDef = (parentId, props) => async dispatch =>
  dispatch(createNodeDef(parentId, nodeDefType.attribute, props))

export const createEntityDef = (parentId, props) => async dispatch =>
  dispatch(createNodeDef(parentId, nodeDefType.entity, props))

// ==== READ

export const fetchNodeDef = (id, draft = false) => async dispatch => {

  try {
    const {data} = await axios.get(`/api/nodeDef/${id}?draft=${draft}`)
    dispatch({type: nodeDefUpdate, ...data})

  } catch (e) { }

}

