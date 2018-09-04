import React from 'react'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

class NodeDefFile extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <NodeDefFormItem {...this.props}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.1fr .9fr',
          alignItems: 'center',
        }}>
          <span className="icon icon-20px icon-upload2"/>
          <Input readOnly={edit}
                 {...getNodeDefInputTextProps(nodeDef)}/>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefFile