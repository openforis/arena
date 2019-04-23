import axios from 'axios'
import * as R from 'ramda'

import { debounceAction } from '../../utils/reduxUtils'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefLayout from '../../../common/survey/nodeDefLayout'
import NodeDefValidations from '../../../common/survey/nodeDefValidations'

import * as SurveyState from '../surveyState'

export const nodeDefsLoad = 'nodeDefs/load'
export const nodeDefCreate = 'nodeDef/create'
export const nodeDefUpdate = 'nodeDef/update'
export const nodeDefPropUpdate = 'nodeDef/prop/update'
export const nodeDefDelete = 'nodeDef/delete'

// ==== CREATE

export const createNodeDef = (parentUuid, type, props) => async (dispatch, getState) => {
  const surveyId = SurveyState.getStateSurveyId(getState())
  const nodeDef = NodeDef.newNodeDef(surveyId, parentUuid, type, props)

  dispatch({ type: nodeDefCreate, nodeDef })

  const { data } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({ type: nodeDefUpdate, ...data })

  dispatch(_updateTableLayout(nodeDef, uuid => R.append(uuid)))
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value = null, advanced = false) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  dispatch({ type: nodeDefPropUpdate, nodeDef, parentNodeDef, nodeDefUuid: NodeDef.getUuid(nodeDef), key, value, advanced })

  dispatch(_putNodeDefProp(nodeDef, key, value, advanced))

  let layout = []
  if (key === NodeDefLayout.nodeDefLayoutProps.render) {
    if (value === NodeDefLayout.nodeDefRenderType.table) {
      layout = Survey.getNodeDefChildren(nodeDef)(survey).map(n => NodeDef.getUuid(n))
    }
    dispatch(putNodeDefProp(nodeDef, NodeDefLayout.nodeDefLayoutProps.layout, layout))
  }
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({ type: nodeDefDelete, nodeDef })

  const surveyId = SurveyState.getStateSurveyId(getState())

  const { data } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}`)

  dispatch({ type: nodeDefsLoad, nodeDefs: data.nodeDefs })

  dispatch(_updateTableLayout(nodeDef, uuid => R.without([uuid])))
}

const _putNodeDefProp = (nodeDef, key, value, advanced) => {
  const action = async (dispatch, getState) => {
    const surveyId = SurveyState.getStateSurveyId(getState())

    const putProps = async (nodeDef, props) => {
      const { data } = await axios.put(
        `/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}/props`,
        props
      )
      return data.nodeDefs
    }

    const propsToUpdate = [{ key, value, advanced }]

    if (key === NodeDef.propKeys.multiple) {
      const validations = value
        ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
        : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))

      propsToUpdate.push({ key: NodeDef.propKeys.validations, value: validations, advanced: true })
    }

    const nodeDefs = await putProps(nodeDef, propsToUpdate)

    dispatch({ type: nodeDefsLoad, nodeDefs })
  }

  return debounceAction(action, `${nodeDefPropUpdate}_${key}`)
}

// ==== UTILS

const _updateTableLayout = (nodeDef, f) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDef.isEntity(parentNodeDef) && NodeDefLayout.isRenderTable(parentNodeDef)) {
    const layout = NodeDefLayout.getLayout(parentNodeDef)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    dispatch(putNodeDefProp(parentNodeDef, NodeDefLayout.nodeDefLayoutProps.layout, f(nodeDefUuid)(layout)))
  }
}