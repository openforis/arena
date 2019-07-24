import React from 'react'
import * as R from 'ramda'

import InputChips from '../../../../../../commonComponents/form/inputChips'
import Dropdown from '../../../../../../commonComponents/form/dropdown'

import NodeDef from '../../../../../../../common/survey/nodeDef'
import CategoryItem from '../../../../../../../common/survey/categoryItem'

const NodeDefCodeDropdown = props => {
  const {
    lang, nodeDef,
    items, selectedItems,
    edit, canEditRecord, readOnly,
    onItemAdd, onItemRemove
  } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {
        NodeDef.isMultiple(nodeDef)
          ? (
            <InputChips
              readOnly={entryDisabled}
              items={items}
              disabled={disabled}
              itemKeyProp="uuid"
              itemLabelFunction={CategoryItem.getLabel(lang)}
              selection={selectedItems}
              onItemAdd={onItemAdd}
              onItemRemove={onItemRemove}
            />
          )
          : (
            <Dropdown
              readOnly={entryDisabled}
              items={items}
              disabled={disabled}
              itemKeyProp="uuid"
              itemLabelFunction={CategoryItem.getLabel(lang)}
              selection={R.head(selectedItems)}
              onChange={item => {
                item
                  ? onItemAdd(item)
                  : onItemRemove(item)
              }}
            />
          )
      }
    </div>
  )
}

export default NodeDefCodeDropdown
