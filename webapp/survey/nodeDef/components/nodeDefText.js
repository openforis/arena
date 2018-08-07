import React from 'react'

import { Input, FormItem } from '../../../commonComponents/form/input'

import { getNodeDefInputTextProps } from './nodeDefSystemProps'

class NodeDefText extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        <Input readOnly={edit}
               {...getNodeDefInputTextProps(nodeDef)}/>
      </FormItem>
    )
  }

}

export default NodeDefText
