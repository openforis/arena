import React from 'react'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

class NodeDefTaxon extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr'
        }}>
          <FormItem label="Code">
            <Input readOnly={edit}/>
          </FormItem>
          <FormItem label="Genus">
            <Input readOnly={edit}/>
          </FormItem>
          <FormItem label="Scientific Name">
            <Input readOnly={edit}/>
          </FormItem>
          <FormItem label="Vernacular Name">
            <Input readOnly={edit}/>
          </FormItem>
        </div>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefTaxon