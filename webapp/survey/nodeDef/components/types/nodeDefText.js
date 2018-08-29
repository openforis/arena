import React from 'react'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { getNodeValue } from '../../../../../common/record/record'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

const NodeDefTextInput = ({nodeDef, node, updateNodeValue, edit,}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         onChange={(e) => updateNodeValue(nodeDef, node, e.target.value)}
         value={getNodeValue(node, '')}/>

const NodeDefText = props => {

  const {nodeDef, edit, nodes} = props

  return (
    <NodeDefFormItem nodeDef={nodeDef}>
      {
        edit || !isNodeDefMultiple(nodeDef)
          ? <NodeDefTextInput node={nodes[0]} {...props} />
          : null //TODO multiple
      }
    </NodeDefFormItem>
  )
}

export default NodeDefText
