import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'
import { getNodeValue } from '../../../../../common/record/record'

class NodeDefText extends React.Component {

  onChange (value) {
    this.props.onChange({value: value})
  }

  render () {
    const {nodeDef, draft, edit, entry, node} = this.props
    const nodeValue = entry && node ? getNodeValue(node) : null
    const value = R.prop('v')(nodeValue)

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <Input readOnly={edit}
               {...getNodeDefInputTextProps(nodeDef)}
               onChange={(e) => this.onChange(e.target.value)}
               value={value}/>
      </NodeDefFormItem>
    )
  }

}

export default NodeDefText
