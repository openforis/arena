import React from 'react'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'
import * as R from 'ramda'

class NodeDefText extends React.Component {

  render () {
    const {nodeDef, draft, edit, entry, parentNode, node, onChange} = this.props
    const value = entry && node ? R.path(['value', 'value'])(node) : null

    return (
      <NodeDefFormItem nodeDef={nodeDef}>
        <Input readOnly={edit}
               {...getNodeDefInputTextProps(nodeDef)}
               onChange={(e) => onChange({value: e.target.value})}
               value={value}/>
      </NodeDefFormItem>
    )
  }

}

export default NodeDefText
