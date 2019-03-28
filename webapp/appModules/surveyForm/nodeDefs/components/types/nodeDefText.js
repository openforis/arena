import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../../../commonComponents/form/input'

import NodeDeleteButton from '../nodeDeleteButton'
import * as NodeDefUI from '../../nodeDefSystemProps'

import NodeDef from '../../../../../../common/survey/nodeDef'

import Node from '../../../../../../common/record/node'
import NodeDefErrorBadge from '../nodeDefErrorBadge'

const multipleNodesWrapper = React.createRef()

const TextInput = ({ nodeDef, readOnly, node, edit, updateNode, canEditRecord }) => (
  <div>
    <Input aria-disabled={edit || !canEditRecord || readOnly}
           {...NodeDefUI.getNodeDefInputTextProps(nodeDef)}
           value={Node.getValue(node, '')}
           onChange={value => updateNode(nodeDef, node, value)}
    />
  </div>
)

const MultipleTextInput = props => {
  const { nodeDef, parentNode, nodes, removeNode, canEditRecord } = props

  return <div className="node-def__entry-multiple">
    <div className="nodes">
      {
        nodes.map(n =>
          (!n.placeholder || canEditRecord) &&
          <div key={`nodeDefTextInput_${n.uuid}`}
               className={`node-def__text-multiple-text-input-wrapper`}
                ref={multipleNodesWrapper}>

            <NodeDefErrorBadge  nodeDef={nodeDef}
                                edit={false}
                                parentNode={parentNode}
                                node={n}
                                container={multipleNodesWrapper}/>

            <TextInput {...props}
                       node={n}/>

            {!n.placeholder && NodeDef.isMultiple(nodeDef) && canEditRecord &&
            <NodeDeleteButton nodeDef={nodeDef}
                              node={n}
                              disabled={R.isEmpty(Node.getValue(n))}
                              showConfirm={true}
                              removeNode={removeNode}/>
            }

          </div>
        )
      }
    </div>
  </div>
}

const NodeDefText = props =>
  props.edit
    ? <TextInput {...props}/>
    : NodeDef.isMultiple(props.nodeDef)
    ? <MultipleTextInput {...props} />
    : <TextInput {...props} node={props.nodes[0]}/>

export default NodeDefText
