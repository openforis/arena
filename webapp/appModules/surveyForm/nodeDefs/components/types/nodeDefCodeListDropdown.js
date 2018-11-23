import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../common/survey/nodeDef'
import CodeList from '../../../../../../common/survey/codeList'
import Node from '../../../../../../common/record/node'

const NodeDefCodeListDropdown = props => {
  const {language, edit, nodeDef, nodes, items = []} = props

  let multiple = NodeDef.isNodeDefMultiple(nodeDef)

  const disabled = R.isEmpty(items)

  const selectedCodes = R.pipe(
    R.values,
    R.reject(node => node.placeholder),
    R.map(n => Node.getNodeValue(n).code),
    R.reject(R.isNil)
  )(nodes)

  const selectedItems = R.filter(item => R.contains(CodeList.getCodeListItemCode(item))(selectedCodes))(items)

  const handleSelectedItemsChange = (newSelectedItems) => {
    const {nodeDef, nodes, parentNode, removeNode, updateNode} = props

    const newSelectedCodes = newSelectedItems.map(item => CodeList.getCodeListItemCode(item))

    if (multiple) {
      //remove deselected node
      const removedNode = R.find(n => !R.contains(Node.getNodeValue(n).code, newSelectedCodes))(nodes)
      if (removedNode && removedNode.id) {
        removeNode(nodeDef, removedNode)
      }
    }
    //add new node or update existing one
    const newSelectedCode = R.pipe(
      R.find(code => !R.contains(code, selectedCodes)),
      R.defaultTo(null),
    )(newSelectedCodes)

    const placeholder = R.find(R.propEq('placeholder', true))(nodes)
    const nodeToUpdate = placeholder
      ? placeholder
      : nodes.length === 1 && !multiple
        ? nodes[0]
        : Node.newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)

    updateNode(nodeDef, nodeToUpdate, {code: newSelectedCode})
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