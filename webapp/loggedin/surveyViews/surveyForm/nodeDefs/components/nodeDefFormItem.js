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
      <FormItem label={labelComponent} className="survey-form__node-def-form-item">
        <div className={`${entry && NodeDef.isMultiple(nodeDef) ? 'survey-form__node-def-multiple-container' : ''}`}>
          {nodeDefComponent}
        </div>
      </FormItem>
    )

}

export default NodeDefFormItem