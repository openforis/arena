import React from 'react'

import { FormItem } from '../../../../commonComponents/form/input'
import { getNodeDefComponent } from '../nodeDefSystemProps'

const NodeDefFormItem = props => {
  const {nodeDef, label} = props

  return <FormItem label={label}>
    {
      React.createElement(getNodeDefComponent(nodeDef), {...props})
    }
  </FormItem>
}

export default NodeDefFormItem