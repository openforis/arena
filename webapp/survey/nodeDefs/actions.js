import axios from 'axios'

import { debounceAction } from '../../appUtils/reduxUtils'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefValidations from '../../../common/survey/nodeDefValidations'
import NodeDefLayout from '../../../common/survey/nodeDefLayout'

import * as SurveyState from '../surveyState'

export const nodeDefsLoad = 'nodeDefs/load'
export const nodeDefCreate = 'nodeDef/create'
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefDelete = 'nodeDef/delete'

import { setFormActivePage } from '../../appModules/surveyForm/actions'

// ==== CREATE

export const createNodeDef = (parentUuid, type, props) => async (dispatch, getState) => {
  const surveyId = SurveyState.getStateSurveyId(getState())
  const nodeDef = NodeDef.newNodeDef(surveyId, parentUuid, type, props)

  dispatch({ type: nodeDefCreate, nodeDef })

  const { data } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({ type: nodeDefUpdate, ...data })
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value = null, advanced = false) => async (dispatch) => {
  dispatch({ type: nodeDefPropUpdate, nodeDefUuid: nodeDef.uuid, key, value, advanced })

  dispatch(_putNodeDefProp(nodeDef, key, value, advanced))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({ type: nodeDefDelete, nodeDef })

  const surveyId = SurveyState.getStateSurveyId(getState())

  const { data } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDef.uuid}`)

  dispatch({ type: nodeDefsLoad, nodeDefs: data.nodeDefs })
}

const _putNodeDefProp = (nodeDef, key, value, advanced) => {
  const action = async (dispatch, getState) => {
    const survey = SurveyState.getSurvey(getState())
    const surveyId = Survey.getId(survey)

    const putProps = async (nodeDef, props) => {
      const { data } = await axios.put(
        `/api/survey/${surveyId}/nodeDef/${nodeDef.uuid}/props`,
        props
      )
      return data.nodeDefs
    }

    const propsToUpdate = [{ key, value, advanced }]

    if (key === 'multiple') {
      const validations = value
        ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
        : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))

      propsToUpdate.push({ key: 'validations', value: validations, advanced: true })
    }

    const nodeDefs = await putProps(nodeDef, propsToUpdate)

    dispatch({ type: nodeDefsLoad, nodeDefs })

    if (key === NodeDefLayout.nodeDefLayoutProps.pageUuid) {
      // when changing displayIn (pageUuid) change form active page

      const activePageNodeDef = value
        ? nodeDef
        : Survey.getNodeDefParent(nodeDef)(survey)

      dispatch(setFormActivePage(activePageNodeDef))
    }
  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

