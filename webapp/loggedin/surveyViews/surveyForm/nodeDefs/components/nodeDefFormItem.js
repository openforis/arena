import React from 'react'

import { FormItem } from '@webapp/commonComponents/form/input'

import * as NodeDef from '@core/survey/nodeDef'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './nodeDefErrorBadge'

const NodeDefFormItemLabel = props => {
  const {
    nodeDef, label, edit,
    parentNode, nodes,
  } = props

  return (
    <NodeDefErrorBadge
      nodeDef={nodeDef}
      edit={edit}
      parentNode={parentNode}
      nodes={nodes}>

      <div>
        {
          NodeDef.isKey(nodeDef) &&
          <span className="icon icon-key2 icon-10px icon-left node-def__icon-key"/>
        }
        {label}
      </div>

    </NodeDefErrorBadge>
  )
}

const NodeDefFormItem = props => {
  const { nodeDef, entry } = props

  const nodeDefComponent = React.createElement(NodeDefUiProps.getComponent(nodeDef), { ...props })

  return NodeDef.isEntity(nodeDef)
    ? (
      nodeDefComponent
    )
    : (
      <FormItem
        label={<NodeDefFormItemLabel {...props}/>}
        className="survey-form__node-def-form-item">

        <div className={`${entry && NodeDef.isMultiple(nodeDef) ? 'survey-form__node-def-multiple-container' : ''}`}>
          {nodeDefComponent}
        </div>

      </FormItem>
    )

}

export default NodeDefFormItem