import React from 'react'

import InputChips from '../../../../commonComponents/form/inputChips'
import NodeDefFormItem from './nodeDefFormItem'

class NodeDefCodeList extends React.Component {

  render () {
    const {nodeDef, draft, edit} = this.props

    const items = [
      {key: '1', value: 'Value 1'},
      {key: '2', value: 'Value 2'},
      {key: '3', value: 'Value 3'},
    ]
    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <InputChips readOnly={edit} items={items}/>
      </NodeDefFormItem>
    )
  }
}

export default NodeDefCodeList