import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../common/survey/nodeDef'
import Category from '../../../../../../common/survey/category'

const NodeDefCodeDropdown = props => {
  const {language, edit, nodeDef, items = [], selectedItems = [], onSelectedItemsChange, canEditRecord} = props

  const disabled = R.isEmpty(items)
  return NodeDef.isNodeDefMultiple(nodeDef)
    ? <InputChips readOnly={edit || !canEditRecord}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={Category.getItemLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => onSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={edit}
                items={items}
                disabled={disabled || !canEditRecord}
                itemKeyProp="uuid"
                itemLabelFunction={Category.getItemLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => onSelectedItemsChange(item ? [item] : [])}/>
}

export default NodeDefCodeDropdown