import React from 'react'
import NodeDefBoolean from './nodeDefBoolean'
import InputChips from '../../../commonComponents/form/inputChips'
import { FormItem } from '../../../commonComponents/form/input'

class NodeDefCodeList extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    const items = [
      {key: '1', value: 'Value 1'},
      {key: '2', value: 'Value 2'},
      {key: '3', value: 'Value 3'},
    ]
    return (
      <FormItem label={nodeDef.props.name}>
        <InputChips items={items}/>
      </FormItem>
    )
  }
}

export default NodeDefCodeList