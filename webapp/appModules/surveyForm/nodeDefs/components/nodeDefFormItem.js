import React from 'react'

import { FormItem } from '../../../../commonComponents/form/input'
import { getNodeDefComponent } from '../nodeDefSystemProps'

import NodeDef from '../../../../../common/survey/nodeDef'

const NodeDefFormItem = props => {
  const {nodeDef, label} = props

  const nodeDefComponent = React.createElement(getNodeDefComponent(nodeDef), {...props})

  return (
    NodeDef.isNodeDefEntity(nodeDef)
      ? nodeDefComponent
      : <FormItem label={label}>
        {nodeDefComponent}
      </FormItem>
  )

}

export default NodeDefFormItem