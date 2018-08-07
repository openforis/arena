import React from 'react'

import { Input, FormItem } from '../../../commonComponents/form/input'

import { getNodeDefInputMask } from './nodeDefSystemProps'

class NodeDefText extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        <Input readOnly={edit}
               {...getNodeDefInputMask(nodeDef)}/>
      </FormItem>
    )
  }

}

export default NodeDefText
