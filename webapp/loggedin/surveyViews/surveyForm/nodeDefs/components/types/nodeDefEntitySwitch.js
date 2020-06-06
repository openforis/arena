import React from 'react'
import { connect } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { SurveyState } from '@webapp/store/survey'

import NodeDefEntityForm from './nodeDefEntityForm'
import NodeDefEntityTable from './nodeDefEntityTable'

const componentsByRenderType = {
  [NodeDefLayout.renderType.form]: NodeDefEntityForm,
  [NodeDefLayout.renderType.table]: NodeDefEntityTable,
}

const NodeDefEntitySwitch = (props) => {
  const { surveyCycleKey, nodeDef } = props
  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)

  return renderType && React.createElement(componentsByRenderType[renderType], props)
}

const mapStateToProps = (state, props) => ({
  childDefs: Survey.getNodeDefChildren(props.nodeDef)(SurveyState.getSurvey(state)),
})

export default connect(mapStateToProps)(NodeDefEntitySwitch)
