import React from 'react'
import { FormItem, Input } from '../../../commonComponents/form/input'
import { getNodeDefInputTextProps } from './nodeDefSystemProps'

class NodeDefFile extends React.Component {

  render() {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '.1fr .9fr',
          alignItems: 'center',
          }}>
          <span className="icon icon-20px icon-upload2" />
          <Input readOnly={edit}
                 {...getNodeDefInputTextProps(nodeDef)}/>
        </div>
      </FormItem>
    )
  }
}

export default NodeDefFile