import React from 'react'

import { FormItem } from '../../../../commonComponents/form/input'

class NodeDefFormItem extends React.Component {

  render () {
    const {children, label} = this.props

    return (
      <FormItem label={label}>
        {children}
      </FormItem>
    )
  }
}

export default NodeDefFormItem
