import React from 'react'
import * as R from 'ramda'

import InputChips from '@webapp/components/form/inputChips'
import Dropdown from '@webapp/components/form/Dropdown'

import * as NodeDef from '@core/survey/nodeDef'
import * as CategoryItem from '@core/survey/categoryItem'

const NodeDefCodeDropdown = props => {
  const {
    lang,
    nodeDef,
    items,
    selectedItems,
    edit,
    entryDataQuery,
    canEditRecord,
    readOnly,
    onItemAdd,
    onItemRemove,
  } = props

  const entryDisabled = edit || !canEditRecord || readOnly

  const disabled = R.isEmpty(items)

  return (
    <div className="survey-form__node-def-code">
      {NodeDef.isMultiple(nodeDef) && !entryDataQuery ? (
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
      ) : (
        <Dropdown
          readOnly={entryDisabled}
          items={items}
          disabled={disabled}
          itemKey="uuid"
          itemLabel={CategoryItem.getLabel(lang)}
          selection={R.head(selectedItems)}
          onChange={item => {
            // NB: onItemRemove is not possible?
            if (item) onItemAdd(item)
            else onItemRemove(item)
          }}
        />
      )}
    </div>
  )
}

export default NodeDefCodeDropdown
