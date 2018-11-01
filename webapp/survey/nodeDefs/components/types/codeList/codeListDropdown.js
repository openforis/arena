import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import { getSurveyDefaultLanguage } from '../../../../../../common/survey/survey'
import { isNodeDefMultiple } from '../../../../../../common/survey/nodeDef'
import { getCodeListItemCode, getCodeListItemLabel } from '../../../../../../common/survey/codeList'
import { getNodeValue, newNode } from '../../../../../../common/record/node'

const CodeListDropdown = props => {
  const {survey, edit, nodeDef, nodes, items = []} = props

  const disabled = R.isEmpty(items)

  const language = getSurveyDefaultLanguage(survey)

  const selectedCodes = R.pipe(
    R.values,
    R.reject(node => node.placeholder),
    R.map(n => getNodeValue(n).code),
  )(nodes)

  const selectedItems = R.filter(item => R.contains(getCodeListItemCode(item))(selectedCodes))(items)

  const handleSelectedItemsChange = (newSelectedItems) => {
    const {nodeDef, nodes, parentNode, removeNode, updateNode} = props

    const newSelectedCodes = newSelectedItems.map(item => getCodeListItemCode(item))

    if (isNodeDefMultiple(nodeDef)) {
      //remove deselected node
      const removedNode = R.find(n => !R.contains(getNodeValue(n).code, newSelectedCodes))(nodes)
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
      : nodes.length === 1 && !isNodeDefMultiple(nodeDef)
        ? nodes[0]
        : newNode(nodeDef.id, parentNode.recordId, parentNode.uuid)

    updateNode(nodeDef, nodeToUpdate, {code: newSelectedCode})
  }

  return isNodeDefMultiple(nodeDef)
    ? <InputChips readOnly={edit}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={getCodeListItemLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => handleSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={edit}
                items={items}
                disabled={disabled}
                itemKeyProp="uuid"
                itemLabelFunction={getCodeListItemLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => handleSelectedItemsChange(item ? [item] : [])}/>
}

export default CodeListDropdown