import React from 'react'
import * as R from 'ramda'

import NodeDef from '../../../../../../common/survey/nodeDef'
import CodeList from '../../../../../../common/survey/codeList'
import Node from '../../../../../../common/record/node'

const Checkbox = props => {
  const {language, edit, item, nodeDef, parentNode, nodes, updateNode, removeNode} = props

  const itemCode = CodeList.getCodeListItemCode(item)
  const matchingNode = R.find(node => Node.getNodeValue(node).code === itemCode)(nodes)
  const selected = !R.isNil(matchingNode)

  return (
    <button
      className={`btn btn-of-light ${selected ? 'active' : ''}`}
      style={{
        pointerEvents: 'all',
      }}
      aria-disabled={edit}
      onClick={() => {
        if (selected) {
          removeNode(nodeDef, matchingNode)
        } else {
          const nodeToUpdate =
            (NodeDef.isNodeDefMultiple(nodeDef) || R.isEmpty(nodes))
              ? Node.newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)
              : nodes[0]
          updateNode(nodeDef, nodeToUpdate, {code: itemCode})
        }
      }}>
      {CodeList.getCodeListItemLabel(language)(item)}
    </button>
  )
}

const NodeDefCodeListCheckbox = props => {
  const {items = []} = props

  const disabled = R.isEmpty(items)

  return <div className="node-def__code-checkbox-wrapper">
    {
      items.map(item =>
        <Checkbox {...props}
                  disabled={disabled}
                  key={item.uuid}
                  item={item}/>
      )
    }
  </div>
}

export default NodeDefCodeListCheckbox