import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../common/survey/nodeDef'
import CategoryItem from '../../../../../../common/survey/categoryItem'

const NodeDefCodeDropdown = props => {
  const {language, edit, nodeDef, readOnly, items = [], selectedItems = [], onSelectedItemsChange, canEditRecord} = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)

  return NodeDef.isMultiple(nodeDef)
    ? <InputChips readOnly={entryDisabled}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={CategoryItem.getLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => onSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={entryDisabled}
                items={items}
                disabled={disabled}
                itemKeyProp="uuid"
                itemLabelFunction={CategoryItem.getLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => onSelectedItemsChange(item ? [item] : [])}/>
}

export default NodeDefCodeDropdown