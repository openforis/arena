import React from 'react'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import NodeDefFormItem from './nodeDefFormItem'

class NodeDefCoordinate extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="X">
            <Input readOnly={edit}/>
          </FormItem>
          <FormItem label="Y">
            <Input readOnly={edit}/>
          </FormItem>
          <FormItem label="SRS">
            <Dropdown readOnly={edit}
                      items={[]}
                      selection={[]}/>
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCoordinate