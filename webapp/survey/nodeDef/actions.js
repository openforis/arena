import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'
import { newNodeDef, isNodeDefEntity } from '../../../common/survey/nodeDef'
import { getPageUUID } from '../../../common/survey/nodeDefLayout'
import { getSurveyId } from '../surveyState'

/**
 * ==== NODE DEFS
 */
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefsUpdate = 'nodeDefs/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefValidationUpdate = 'nodeDef/validation/updated'

// ==== CREATE

export const createNodeDef = (parentId, type, props) => async (dispatch, getState) => {
  try {
    const surveyId = getSurveyId(getState())
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
  } catch (e) { }
}

// ==== READ

export const fetchNodeDefChildren = (id, draft = false, validate = false) => async dispatch => {
  try {
    const {data} = await axios.get(`/api/nodeDef/${id}/children?draft=${draft}&validate=${validate}`)
    dispatch({type: nodeDefsUpdate, ...data})
  } catch (e) { }
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value) => async dispatch => {
  dispatch({type: nodeDefPropUpdate, nodeDefUUID: nodeDef.uuid, key, value})
  dispatch(_putNodeDefProp(nodeDef, key, value))
}

const _putNodeDefProp = (nodeDef, key, value) => {
  const action = async dispatch => {
    try {
      const res = await axios.put(`/api/nodeDef/${nodeDef.id}/prop`, {key, value})
      //update node def validation
      const {validation} = res.data
      dispatch({type: nodeDefValidationUpdate, nodeDefUUID: nodeDef.uuid, validation})
    } catch (e) { }

  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

/**
 * ==== SURVEY-FORM EDIT MODE - NODE DEFS
 */
export const formNodeDefEditUpdate = 'survey/form/nodeDefEdit/update'
export const formNodeDefUnlockedUpdate = 'survey/form/nodeDefUnlocked/update'
export const formNodeDefViewPage = 'survey/form/nodeDefViewPage/update'

export const setFormNodeDefEdit = nodeDef => dispatch => dispatch({type: formNodeDefEditUpdate, nodeDef})

export const setFormNodeDefUnlocked = nodeDef => dispatch => dispatch({type: formNodeDefUnlockedUpdate, nodeDef})

export const setFormActivePage = (nodeDef, node, parentNode) => dispatch =>
  dispatch({type: formNodeDefViewPage, nodeDef, node, parentNode})

export const closeFormNodeDefEdit = nodeDef => async dispatch => {
  const res = await axios.get(`/api/nodeDef/${nodeDef.id}/validation`)
  const {validation} = res.data

  if (!validation || validation.valid) {
    dispatch({type: formNodeDefEditUpdate, nodeDef: null})
  } else {
    dispatch({type: nodeDefValidationUpdate, nodeDefUUID: nodeDef.uuid, validation})
  }
}
