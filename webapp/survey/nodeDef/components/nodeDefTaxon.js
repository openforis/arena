import React from 'react'
import { FormItem, Input } from '../../../commonComponents/form/input'

class NodeDefTaxon extends React.Component {

  render() {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
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
      </FormItem>
    )
  }
}

export default NodeDefTaxon