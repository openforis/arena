import React from 'react'

import { Input } from '../../../../commonComponents/form/input'
import NodeDefFormItem from './nodeDefFormItem'

import { isNodeDefMultiple } from '../../../../../common/survey/nodeDef'
import { getNodeValue } from '../../../../../common/record/record'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'

const NodeDefTextInput = ({nodeDef, node, parentNode, edit, addNode, updateNodeValue, placeholder = false}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         onChange={(e) =>
           placeholder
             ? addNode(nodeDef, parentNode, e.target.value)
             : updateNodeValue(nodeDef, node, e.target.value)
         }
         value={getNodeValue(node, '')}/>

const MultipleNodeDefTextInput = (props) => {
  const {nodeDef, nodes, removeNode} = props
  return <div>
    {nodes.map(n =>
        <div key={`nodeDefTextInput_${n.uuid}`}
             style={{
              display: 'grid',
              gridTemplateColumns: '.9fr .1fr'
             }}>
          <NodeDefTextInput node={n} {...props} />
          <button className="btn-of-light-xs btn-s"
                  style={{padding: '.2rem .5rem'}}
                  onClick={() => removeNode(nodeDef, n)}>
            <span className="icon icon-cross icon-8px"/>
          </button>
        </div>
      )
    }
    <NodeDefTextInput placeholder={true} {...props} />
  </div>
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
