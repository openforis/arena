import React from 'react'
import { FormItem, Input } from '../../../commonComponents/form/input'
import Dropdown from '../../../commonComponents/form/dropdown'

class NodeDefCoordinate extends React.Component {

  render() {
    const {nodeDef, draft, edit} = this.props

    return (
      <FormItem label={nodeDef.props.name}>
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
            <Dropdown items={[]}
                      selection={[]}/>
          </FormItem>
        </div>
      </FormItem>
    )
  }
}

export default NodeDefCoordinate