import React from 'react'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

class NodeDefText extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <Input readOnly={edit}
               {...getNodeDefInputTextProps(nodeDef)}/>
      </NodeDefFormItem>
    )
  }

}

export default NodeDefText
