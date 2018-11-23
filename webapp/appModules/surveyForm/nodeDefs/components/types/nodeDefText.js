import React from 'react'
import * as R from 'ramda'

import { limitToParentHeight } from '../../../../../appUtils/domUtils'

import { Input } from '../../../../../commonComponents/form/input'
import NodeDeleteButton from '../nodeDeleteButton'
import { getNodeDefInputTextProps } from '../../nodeDefSystemProps'

import NodeDef from '../../../../../../common/survey/nodeDef'

import Node from '../../../../../../common/record/node'

const TextInput = ({nodeDef, node, parentNode, edit, updateNode}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         value={Node.getNodeValue(node, '')}
         onValueChange={value => updateNode(nodeDef, node, value)}
  />

const MultipleTextInput = props => {
  const {nodeDef, nodes, removeNode} = props

  return <div className="overflowYAuto"
              ref={elem => limitToParentHeight(elem)}>
    {
      nodes.map(n =>
        <div key={`nodeDefTextInput_${n.uuid}`}
             className="node-def__text-multiple-text-input-wrapper">

          <TextInput {...props}
                     node={n}/>

          {!n.placeholder && NodeDef.isNodeDefMultiple(nodeDef) &&
          <NodeDeleteButton nodeDef={nodeDef}
                            node={n}
                            disabled={R.isEmpty(Node.getNodeValue(n))}
                            showConfirm={true}
                            removeNode={removeNode}/>
          }

        </div>
      )
    }
  </div>
}

const NodeDefText = props =>
  props.edit
    ? <TextInput {...props}/>
    : NodeDef.isNodeDefMultiple(props.nodeDef)
    ? <MultipleTextInput {...props} />
    : <TextInput {...props} node={props.nodes[0]}/>

export default NodeDefText
