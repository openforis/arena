import React from 'react'
import * as R from 'ramda'
import { isNotBlank } from '../../../../../common/stringUtils'
import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { getNodeValue, newNode } from '../../../../../common/record/record'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

const NodeDefTextInput = ({nodeDef, node, parentNode, edit, addNode, updateNodeValue}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         value={getNodeValue(node, '')}
         onChange={(e) => {
           const {value} = e.target

           if (node.placeholder) {
             if (isNotBlank(value)) {
               const nodeToAdd = R.pipe(R.dissoc('placeholder'), R.assoc('value', e.target.value))(node)
               addNode(nodeDef, nodeToAdd)
             }
           } else {
             updateNodeValue(nodeDef, node, e.target.value)
           }
         }}
  />

const MultipleNodeDefTextInput = (props) => {
  const {nodeDef, nodes, removeNode, parentNode} = props

  const nodePlaceholder = {...newNode(nodeDef.id, parentNode.recordId, parentNode.id), placeholder: true}
  const nodesToRender = R.concat(nodes, [nodePlaceholder])

  return (
    <div>
      {
        nodesToRender.map(n =>
          <div key={`nodeDefTextInput_${n.uuid}`}
               style={{
                 display: 'grid',
                 gridTemplateColumns: '.9fr .1fr'
               }}>
            <NodeDefTextInput node={n} {...props} />
            {
              n.placeholder
                ? null
                : <button className="btn btn-s btn-of-light-xs"
                          style={{
                            alignSelf: 'center',
                            justifySelf: 'center',
                          }}
                          onClick={() => removeNode(nodeDef, n)}>
                  <span className="icon icon-bin icon-12px"/>
                </button>
            }
          </div>
        )
      }
    </div>
  )
}

const NodeDefText = props => {

  const {nodeDef, edit, nodes} = props

  return (
    <NodeDefFormItem nodeDef={nodeDef}>
      {
        edit || !isNodeDefMultiple(nodeDef)
          ? <NodeDefTextInput node={nodes[0]} {...props} />
          : <MultipleNodeDefTextInput {...props} />
      }
    </NodeDefFormItem>
  )
}

export default NodeDefText
