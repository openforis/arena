import React from 'react'
import * as R from 'ramda'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import NodeDefDeleteButton from '../nodeDefDeleteButton'

import { nodeDefRenderType } from '../../../../../common/survey/nodeDefLayout'
import NodeDef from '../../../../../common/survey/nodeDef'

import Node from '../../../../../common/record/node'
import { getNodeDefInputTextProps } from '../nodeDefSystemProps'
import { elementOffset } from '../../../../appUtils/domUtils'

const NodeDefTextInput = ({nodeDef, node, parentNode, edit, updateNode}) =>
  <Input readOnly={edit}
         {...getNodeDefInputTextProps(nodeDef)}
         value={Node.getNodeValue(node, '')}
         onChange={(e) =>
           updateNode(nodeDef, node, e.target.value)
         }
  />

const NodeDefText = props => {

  const {
    nodeDef, nodes, parentNode, entry,
    edit, label, renderType, removeNode
  } = props

  // table header
  if (renderType === nodeDefRenderType.tableHeader) {
    return <label className="node-def__table-header">
      {label}
    </label>
  }

  // EDIT MODE

  if (edit)
    return <FormItem label={label}>
      <NodeDefTextInput {...props} />
    </FormItem>

  // ENTRY MODE

  if (entry && renderType === nodeDefRenderType.tableBody)
    return <NodeDefTextInput {...props} node={nodes[0]}/>
  else {
    const domElem = document.getElementById(nodeDef.uuid)
    const {height} = domElem ? elementOffset(domElem) : {height: 80}

    return (
      <FormItem label={label}>
        <div className="overflowYAuto" style={{display: 'grid', alignContent: 'center',  height}}>
          {
            nodes.map(n =>
              <div key={`nodeDefTextInput_${n.uuid}`}
                   style={{
                     display: 'grid',
                     gridTemplateColumns: '.9fr .1fr'
                   }}>

                <NodeDefTextInput {...props} node={n}/>

                {!n.placeholder && NodeDef.isNodeDefMultiple(nodeDef) &&
                <NodeDefDeleteButton nodeDef={nodeDef}
                                     node={n}
                                     disabled={edit || R.isEmpty(Node.getNodeValue(n))}
                                     showConfirm={true}
                                     removeNode={removeNode}/>
                }

              </div>
            )
          }
        </div>
      </FormItem>
    )
  }
}

export default NodeDefText
