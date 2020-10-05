import React from 'react'

import * as A from '@core/arena'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useSurvey } from '@webapp/store/survey'

import NodeDefEntityForm from './nodeDefEntityForm'
import NodeDefEntityTable from './nodeDefEntityTable'

const componentsByRenderType = {
  [NodeDefLayout.renderType.form]: NodeDefEntityForm,
  [NodeDefLayout.renderType.table]: NodeDefEntityTable,
}

const NodeDefEntitySwitch = (props) => {
  const { surveyCycleKey, nodeDef } = props

  const survey = useSurvey()
  const childDefs = Survey.getNodeDefChildren(props.nodeDef)(survey)

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)

  // attributes used in tests
  let nodeDefName = null
  let childNames = null
  if (ProcessUtils.isEnvDevelopment) {
    nodeDefName = NodeDef.getName(nodeDef)
    const childUuids = NodeDefLayout.getLayoutChildrenUuids(surveyCycleKey)(nodeDef)
    childNames = childUuids.map((childUuid) => A.pipe(Survey.getNodeDefByUuid(childUuid), NodeDef.getName)(survey))
  }

  return (
    <div
      className={`survey-form__node-def-entity-wrapper`}
      data-node-def-name={nodeDefName}
      data-child-names={childNames}
    >
      {React.createElement(componentsByRenderType[renderType], { ...props, childDefs })}
    </div>
  )
}

export default NodeDefEntitySwitch
