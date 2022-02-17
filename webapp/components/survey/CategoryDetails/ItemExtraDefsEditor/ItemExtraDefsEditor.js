import './ItemExtraDefsEditor.scss'

import React from 'react'
import { ButtonAdd, PanelRight } from '@webapp/components'

import { ItemExtraDefEditor } from './ItemExtraDefEditor'
import { useItemExtraDefsEditor } from './useItemExtraDefsEditor'

export const ItemExtraDefsEditor = (props) => {
  const { Actions, i18n, itemExtraDefs, readOnly, onItemAdd, onItemDelete, onItemUpdate } =
    useItemExtraDefsEditor(props)

  return (
    <PanelRight
      className="category-edit__extra-defs-editor"
      header={i18n.t('categoryEdit.extraProp', { count: 2 })}
      width="52rem"
      onClose={Actions.toggleEditExtraPropertiesPanel}
    >
      <div className="items-container">
        {itemExtraDefs.map((itemExtraDef, index) => (
          <ItemExtraDefEditor
            key={itemExtraDef.uuid}
            itemExtraDef={itemExtraDef}
            itemExtraDefs={itemExtraDefs}
            index={index}
            readOnly={readOnly}
            onItemDelete={onItemDelete}
            onItemUpdate={onItemUpdate}
          />
        ))}
      </div>
      <ButtonAdd
        className="item-add-btn"
        disabled={readOnly || itemExtraDefs.some((item) => item.newItem)}
        onClick={onItemAdd}
      />
    </PanelRight>
  )
}
