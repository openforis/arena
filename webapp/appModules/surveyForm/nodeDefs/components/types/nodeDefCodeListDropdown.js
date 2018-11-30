import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../common/survey/nodeDef'
import CodeList from '../../../../../../common/survey/codeList'
import Node from '../../../../../../common/record/node'

const determineNodeToUpdate = (nodes, parentNode, multiple) => {
  const placeholder = R.find(R.propEq('placeholder', true))(nodes)

  return (
    placeholder
      ? placeholder
      : nodes.length === 1 && !multiple
      ? nodes[0]
      : Node.newNode(nodeDef.uuid, parentNode.recordId, parentNode.uuid)
  )
}

const NodeDefCodeListDropdown = props => {
  const {language, edit, nodeDef, nodes, items = [], codeUUIDsHierarchy} = props

  let multiple = NodeDef.isNodeDefMultiple(nodeDef)

  const disabled = R.isEmpty(items)

  const selectedItemUUIDs = R.pipe(
    R.values,
    R.reject(R.propEq('placeholder', true)),
    R.map(Node.getNodeItemUUID),
    R.reject(R.isNil),
  )(nodes)

  const selectedItems = R.filter(item => R.contains(item.uuid)(selectedItemUUIDs))(items)

  const handleSelectedItemsChange = (newSelectedItems) => {
    const {nodeDef, nodes, parentNode, removeNode, updateNode} = props

    const newSelectedItem = R.head(R.difference(newSelectedItems, selectedItems))

    if (multiple) {
      //remove deselected node
      const deselectedItem = R.head(R.difference(selectedItems, newSelectedItems))
      if (deselectedItem) {
        const removedNode = R.find(n => Node.getNodeValue(n).itemUUID === deselectedItem.uuid)(nodes)
        if (removedNode && removedNode.id) {
          removeNode(nodeDef, removedNode)
        }
      }
    }

    const nodeToUpdate = determineNodeToUpdate(nodes, parentNode, multiple)

    updateNode(nodeDef, nodeToUpdate, {itemUUID: newSelectedItem ? newSelectedItem.uuid : null, h: codeUUIDsHierarchy})
  }

  return multiple
    ? <InputChips readOnly={edit}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={CodeList.getCodeListItemLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => handleSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={edit}
                items={items}
                disabled={disabled}
                itemKeyProp="uuid"
                itemLabelFunction={CodeList.getCodeListItemLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => handleSelectedItemsChange(item ? [item] : [])}/>
}

export default NodeDefCodeListDropdown