import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import { isNodeDefEntity, newNodeDef } from '../../../common/survey/nodeDef'
import { getPageUUID } from '../../../common/survey/nodeDefLayout'
import { getStateSurveyId } from '../surveyState'
import { dispatchMarkCurrentSurveyDraft } from '../actions'
import { setFormActivePage, setFormNodeDefEdit, setFormNodeDefUnlocked } from '../form/actions'

/**
 * ==== NODE DEFS
 */
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefsUpdate = 'nodeDefs/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefDelete = 'nodeDef/delete'

// ==== CREATE

export const createNodeDef = (parentId, type, props) => async (dispatch, getState) => {
  try {
    const surveyId = getStateSurveyId(getState())
    const nodeDef = newNodeDef(surveyId, parentId, type, props)
    dispatch({type: nodeDefUpdate, nodeDef})
    //setting current editing nodeDef
    dispatch(setFormNodeDefEdit(nodeDef))

    if (isNodeDefEntity(nodeDef)) {
      dispatch(setFormNodeDefUnlocked(nodeDef))
      if (getPageUUID(nodeDef))
        dispatch(setFormActivePage(nodeDef))
    }

    const {data} = await axios.post(`/api/nodeDef`, nodeDef)
    dispatch({type: nodeDefUpdate, ...data})

    dispatchMarkCurrentSurveyDraft(dispatch, getState)
  } catch (e) { }
}

// ==== READ

export const fetchNodeDefs = (draft = false) => async (dispatch, getState) => {
  try {
    const surveyId = getStateSurveyId(getState())
    const {data} = await axios.get(`/api/survey/${surveyId}/nodeDefs?draft=${draft}`)

    dispatch({type: nodeDefsUpdate, nodeDefs: data.nodeDefs})
  } catch (e) { }
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value) => async (dispatch, getState) => {
  dispatch({type: nodeDefPropUpdate, nodeDefUUID: nodeDef.uuid, key, value})
  dispatch(_putNodeDefProp(nodeDef, key, value))
  dispatchMarkCurrentSurveyDraft(dispatch, getState)
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({type: nodeDefDelete, nodeDef})
  dispatchMarkCurrentSurveyDraft(dispatch, getState)

  await axios.delete(`/api/nodeDef/${nodeDef.id}`)
}

const _putNodeDefProp = (nodeDef, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/nodeDef/${nodeDef.id}/prop`, {key, value})
      //update node defs with their validation status
      const {nodeDefs} = res.data
      dispatch({type: nodeDefsUpdate, nodeDefs})
    } catch (e) { }

  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

