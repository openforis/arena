import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '../../../common/uuid'

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

// ==== Internal update nodeDefs actions

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (dispatch, getState) => {
  const url = `/api/survey/${SurveyState.getSurveyId(getState())}/nodeDef/${NodeDef.getUuid(nodeDef)}/props`
  const data = { props, propsAdvanced }
  const { data: { nodeDefs } } = await axios.put(url, data)
  dispatch({ type: nodeDefsLoad, nodeDefs })
}

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) => debounceAction(
  _putNodeDefProps(nodeDef, props, propsAdvanced),
  `${nodeDefPropsUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`
)

const _updateParentLayout = (nodeDef, deleted = false) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDef.isEntity(nodeDefParent) && NodeDefLayout.isRenderTable(nodeDefParent)) {
    const nodeDefParentLayout = NodeDefLayout.getLayout(nodeDefParent)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    const newLayout = deleted ? R.without([nodeDefUuid])(nodeDefParentLayout) : R.append(nodeDefUuid)(nodeDefParentLayout)
    dispatch(putNodeDefProp(nodeDefParent, NodeDefLayout.nodeDefLayoutProps.layout, newLayout))
  }
}

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
    const isRenderTable = value === NodeDefLayout.nodeDefRenderType.table
    const isRenderForm = value === NodeDefLayout.nodeDefRenderType.form

    props[NodeDefLayout.nodeDefLayoutProps.layout] = isRenderTable
      ? Survey.getNodeDefChildren(nodeDef)(survey).map(n => NodeDef.getUuid(n))
      : null

    // entity rendered as form can only exists in its own page
    if (isRenderForm && NodeDefLayout.isDisplayInParentPage(nodeDef)) {
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = uuidv4()
    }

  } else if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  dispatch({
    type: nodeDefPropsUpdate,
    nodeDef,
    parentNodeDef,
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    props,
    propsAdvanced
  })

  dispatch(_putNodeDefPropsDebounced(nodeDef, key, props, propsAdvanced))
}

// ==== DELETE
export const removeNodeDef = (nodeDef) => async (dispatch, getState) => {
  dispatch({ type: nodeDefDelete, nodeDef })

  const surveyId = SurveyState.getSurveyId(getState())

  const { data } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}`)

  dispatch({ type: nodeDefsLoad, nodeDefs: data.nodeDefs })

  dispatch(_updateParentLayout(nodeDef, true))
}
