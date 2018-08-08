import React from 'react'

import { FormItem } from '../../../../commonComponents/form/input'

class NodeDefFormItem extends React.Component {

  render () {
    const {nodeDef, children} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        {children}
      </FormItem>
    )
  }
}

export default NodeDefFormItem
