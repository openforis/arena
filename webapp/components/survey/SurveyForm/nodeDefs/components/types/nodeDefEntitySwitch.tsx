import './nodeDefEntitySwitch.scss'

import React from 'react'

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

  const renderType = NodeDefLayout.getRenderType(surveyCycleKey)(nodeDef)
  if (!renderType) {
    // node def not in current cycle
    return null
  }

  const childDefs = Survey.getNodeDefChildrenSorted({
    nodeDef,
    cycle: surveyCycleKey,
    includeLayoutElements: true,
  })(survey)

  const nodeDefName = NodeDef.getName(nodeDef)
  const childUuids = NodeDefLayout.getLayoutChildrenUuids(surveyCycleKey)(nodeDef)
  const childNames = childUuids.map((uuid) => NodeDef.getName(Survey.getNodeDefByUuid(uuid)(survey)))

  return (
    <div
      className="survey-form__node-def-entity-wrapper"
      data-node-def-name={nodeDefName}
      data-child-names={childNames}
    >
      {React.createElement(componentsByRenderType[renderType], { ...props, childDefs })}
    </div>
  )
}

export default NodeDefEntitySwitch
