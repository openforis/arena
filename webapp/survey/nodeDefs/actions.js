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
export const nodeDefPropsUpdate = 'nodeDef/props/update'
export const nodeDefDelete = 'nodeDef/delete'

// ==== CREATE

export const createNodeDef = (parentUuid, type, props) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  const nodeDef = NodeDef.newNodeDef(parentUuid, type, props)

  dispatch({ type: nodeDefCreate, nodeDef })

  const { data } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({ type: nodeDefUpdate, ...data })

  dispatch(_updateParentLayout(nodeDef))
}

// ==== UPDATE
export const putNodeDefProp = (nodeDef, key, value = null, advanced = false) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDefLayout.nodeDefLayoutProps.render) {
    // If setting layout render mode (table | form), set the the proper layout
    props[NodeDefLayout.nodeDefLayoutProps.layout] = (value === NodeDefLayout.nodeDefRenderType.table)
      ? Survey.getNodeDefChildren(nodeDef)(survey).map(n => NodeDef.getUuid(n))
      : null
  } else if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  dispatch({ type: nodeDefPropsUpdate, nodeDef, parentNodeDef, nodeDefUuid: NodeDef.getUuid(nodeDef), props, propsAdvanced })

  dispatch(_putNodeDefProps(nodeDef, key, props, propsAdvanced))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({ type: nodeDefDelete, nodeDef })

  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}`)

  dispatch({ type: nodeDefsLoad, nodeDefs: data.nodeDefs })

  dispatch(_updateParentLayout(nodeDef, true))
}

const _putNodeDefProps = (nodeDef, key, props, propsAdvanced) => {
  const action = async (dispatch, getState) => {
    const surveyId = SurveyState.getSurveyId(getState())

    const putProps = async (nodeDef, props, propsAdvanced) => {
      const { data } = await axios.put(
        `/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}/props`,
        { props, propsAdvanced }
      )
      return data.nodeDefs
    }

    const nodeDefs = await putProps(nodeDef, props, propsAdvanced)

    dispatch({ type: nodeDefsLoad, nodeDefs })
  }

  return debounceAction(action, `${nodeDefPropsUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`)
}

// ==== UTILS

const _updateParentLayout = (nodeDef, deleted = false) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDef.isEntity(parentNodeDef) && NodeDefLayout.isRenderTable(parentNodeDef)) {
    const layout = NodeDefLayout.getLayout(parentNodeDef)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    const newLayout = deleted ? R.without([nodeDefUuid])(layout) : R.append(nodeDefUuid)(layout)
    dispatch(putNodeDefProp(parentNodeDef, NodeDefLayout.nodeDefLayoutProps.layout, newLayout))
  }
}