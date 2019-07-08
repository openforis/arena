import React from 'react'

import { FormItem } from '../../../../../commonComponents/form/input'
import { getNodeDefComponent } from '../nodeDefSystemProps'

import NodeDef from '../../../../../../common/survey/nodeDef'

const NodeDefFormItem = props => {
  const { nodeDef, label, entry } = props

  const nodeDefComponent = React.createElement(getNodeDefComponent(nodeDef), { ...props })

  const labelComponent = <div>
    {
      NodeDef.isKey(nodeDef) &&
      <span className="icon icon-key2 icon-10px icon-left node-def__icon-key"/>
    }
    {label}
  </div>

  return NodeDef.isEntity(nodeDef)
    ? nodeDefComponent
    : (
      <FormItem label={labelComponent} className="node-def__form-item">
        <div
          className={`survey-form__node-def-${NodeDef.getType(nodeDef)} ${entry && NodeDef.isMultiple(nodeDef) ? 'multiple' : ''}`}>
          {nodeDefComponent}
        </div>
      </FormItem>
    )

}

export default NodeDefFormItem