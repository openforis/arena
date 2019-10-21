import React from 'react'
import { connect } from 'react-redux'

import { NodeDefEntityTable } from '../../internal'
import { NodeDefEntityForm } from '../../internal'

import Survey from '../../../../../../../core/survey/survey'
import NodeDefLayout from '../../../../../../../core/survey/nodeDefLayout'

import * as SurveyState from '../../../../../../survey/surveyState'

const componentsByRenderType = {
  [NodeDefLayout.renderType.form]: NodeDefEntityForm,
  [NodeDefLayout.renderType.table]: NodeDefEntityTable,
}

const _NodeDefEntitySwitch = props => {

  const { surveyCycleKey, nodeDef } = props
  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)

  return renderType && React.createElement(componentsByRenderType[renderType], props)
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(SurveyState.getSurvey(state)),
})

export const NodeDefEntitySwitch = connect(mapStateToProps)(_NodeDefEntitySwitch)
export default NodeDefEntitySwitch
