import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { getNodeValue, newNodePlaceholder } from '../../../../../common/record/record'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

const NodeDefTextInput = ({nodeDef, node, parentNode, edit, updateNode}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         value={getNodeValue(node, '')}
         onChange={(e) =>
           updateNode(nodeDef, node, e.target.value)
         }
  />

const NodeDefDeleteButton = ({nodeDef, node, removeNode}) =>
  node.placeholder || !isNodeDefMultiple(nodeDef)
    ? null
    : <button className="btn btn-s btn-of-light-xs"
              style={{
                alignSelf: 'center',
                justifySelf: 'center',
              }}
              onClick={() => removeNode(nodeDef, node)}>
      <span className="icon icon-bin icon-12px"/>
    </button>

const NodeDefText = props => {

  const {edit, nodeDef, nodes, parentNode} = props

  if(edit)
    return <NodeDefFormItem nodeDef={nodeDef}>
      <NodeDefTextInput {...props} />
    </NodeDefFormItem>

  const nodesToRender = R.isEmpty(nodes) || isNodeDefMultiple(nodeDef)
    ? R.concat(nodes, [newNodePlaceholder(nodeDef, parentNode)])
    : nodes

  return (
    <NodeDefFormItem nodeDef={nodeDef}>
      <div className="overflowYAuto">
        {
          nodesToRender.map(n =>
            <div key={`nodeDefTextInput_${n.uuid}`}
                 style={{
                   display: 'grid',
                   gridTemplateColumns: '.9fr .1fr'
                 }}>

              <NodeDefTextInput node={n} {...props} />

              <NodeDefDeleteButton node={n} {...props} />

            </div>
          )
        }
      </div>
    </NodeDefFormItem>
  )
}

export default NodeDefText
