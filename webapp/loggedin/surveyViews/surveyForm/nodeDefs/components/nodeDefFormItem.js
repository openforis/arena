import React, { useRef } from 'react'

import { FormItem } from '../../../../../commonComponents/form/input'

import NodeDef from '../../../../../../common/survey/nodeDef'

import * as NodeDefUiProps from '../nodeDefUIProps'
import NodeDefErrorBadge from './nodeDefErrorBadge'

const NodeDefFormItemLabel = props => {
  const {
    nodeDef, label, edit,
    parentNode, nodes,
  } = props

  const elementRef = useRef(null)

  return (
    <div ref={elementRef}>
      <NodeDefErrorBadge
        nodeDef={nodeDef}
        edit={edit}
        parentNode={parentNode}
        nodes={nodes}
        container={elementRef}>
        <div>
          {
            NodeDef.isKey(nodeDef) &&
            <span className="icon icon-key2 icon-10px icon-left node-def__icon-key"/>
          }
          {label}
        </div>
      </NodeDefErrorBadge>
    </div>
  )
}

const NodeDefFormItem = props => {
  const { nodeDef, entry } = props

  const nodeDefComponent = React.createElement(NodeDefUiProps.getNodeDefComponent(nodeDef), { ...props })

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