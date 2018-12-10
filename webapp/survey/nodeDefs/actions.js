import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../appUtils/reduxUtils'

import NodeDef from '../../../common/survey/nodeDef'
import NodeDefValidations from '../../../common/survey/nodeDefValidations'
import { getStateSurveyId } from '../surveyState'

export const nodeDefsLoad = 'nodeDefs/load'

export const nodeDefCreate = 'nodeDef/create'
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefDelete = 'nodeDef/delete'

// ==== CREATE

export const createNodeDef = (parentUuid, type, props) => async (dispatch, getState) => {
  const surveyId = getStateSurveyId(getState())
  const nodeDef = NodeDef.newNodeDef(surveyId, parentUuid, type, props)

  dispatch({type: nodeDefCreate, nodeDef})

  const {data} = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({type: nodeDefUpdate, ...data})
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value, advanced = false) => async (dispatch) => {
  dispatch({type: nodeDefPropUpdate, nodeDefUuid: nodeDef.uuid, key, value, advanced})

  dispatch(_putNodeDefProp(nodeDef, key, value, advanced))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({type: nodeDefDelete, nodeDef})

  const surveyId = getStateSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDef.uuid}`)
}

const _putNodeDefProp = (nodeDef, key, value, advanced) => {
  const action = async (dispatch, getState) => {
    const surveyId = getStateSurveyId(getState())

    const putProp = async (nodeDef, key, value, advanced) => {
      const {data} = await axios.put(
        `/api/survey/${surveyId}/nodeDef/${nodeDef.uuid}/prop`,
        {key, value, advanced}
      )
      return data.nodeDefs
    }

    let nodeDefs = await putProp(nodeDef, key, value, advanced)

    if (key === 'multiple') {
      const validations = value
        ? NodeDefValidations.assocRequired(null)(NodeDef.getNodeDefValidations(nodeDef))
        : R.pipe(
          NodeDefValidations.assocMinCount(null),
          NodeDefValidations.assocMaxCount(null),
        )(NodeDef.getNodeDefValidations(nodeDef))

      nodeDefs = await putProp(nodeDef, 'validations', validations, true)
    }

    dispatch({type: nodeDefsLoad, nodeDefs})
  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

