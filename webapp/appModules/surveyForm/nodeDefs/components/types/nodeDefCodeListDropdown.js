import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../common/survey/nodeDef'
import CodeList from '../../../../../../common/survey/codeList'

const NodeDefCodeListDropdown = props => {
  const {language, edit, nodeDef, items = [], selectedItems = [], onSelectedItemsChange} = props

  const disabled = R.isEmpty(items)

  return NodeDef.isNodeDefMultiple(nodeDef)
    ? <InputChips readOnly={edit}
                  items={items}
                  disabled={disabled}
                  itemKeyProp="uuid"
                  itemLabelFunction={CodeList.getCodeListItemLabel(language)}
                  selection={selectedItems}
                  onChange={selectedItems => onSelectedItemsChange(selectedItems)}/>

    : <Dropdown readOnly={edit}
                items={items}
                disabled={disabled}
                itemKeyProp="uuid"
                itemLabelFunction={CodeList.getCodeListItemLabel(language)}
                selection={R.head(selectedItems)}
                onChange={item => onSelectedItemsChange(item ? [item] : [])}/>
}

export default NodeDefCodeListDropdown