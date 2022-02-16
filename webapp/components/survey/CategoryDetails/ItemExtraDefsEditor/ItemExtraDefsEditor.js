import './ItemExtraDefsEditor.scss'

import React, { useCallback, useState } from 'react'

import { ArrayUtils } from '@core/arrayUtils'
import * as Category from '@core/survey/category'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { State, useActions } from '../store'
import { ButtonAdd, PanelRight } from '@webapp/components'

import { ItemExtraDefEditor } from './ItemExtraDefEditor'
import { useConfirm } from '@webapp/components/hooks'

export const ItemExtraDefsEditor = (props) => {
  const { state: categoryState, setState: setCategoryState } = props

  const i18n = useI18n()
  const Actions = useActions({ setState: setCategoryState })
  const readOnly = !useAuthCanEditSurvey()
  const confirm = useConfirm()

  const category = State.getCategory(categoryState)

  const calculateInitialState = useCallback(
    () => ({
      itemExtraDefs: Category.getItemExtraDefsArray(category),
    }),
    [category]
  )

  const [state, setState] = useState(calculateInitialState())

  const { itemExtraDefs } = state

  const updateItemExtraDefs = useCallback(
    (itemExtraDefsUpdated) => setState((statePrev) => ({ ...statePrev, itemExtraDefs: itemExtraDefsUpdated })),
    [setState]
  )

  const onAdd = useCallback(async () => {
    const itemExtraDef = {
      ...CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.text }),
      name: '', // name property is used only in UI
      newItem: true,
    }
    updateItemExtraDefs([...itemExtraDefs, itemExtraDef])
  }, [itemExtraDefs])

  const onItemUpdate = useCallback(
    async ({ index, itemExtraDefUpdated }) => {
      const itemExtraDefOld = itemExtraDefs[index]

      const itemExtraDefsUpdated = [...itemExtraDefs]
      itemExtraDefsUpdated[index] = itemExtraDefUpdated
      updateItemExtraDefs(itemExtraDefsUpdated)

      Actions.updateCategoryItemExtraPropItem({
        categoryUuid: Category.getUuid(category),
        name: CategoryItemExtraDef.getName(itemExtraDefOld),
        itemExtraDef: itemExtraDefUpdated,
      })
    },
    [itemExtraDefs, updateItemExtraDefs]
  )

  const onItemDelete = useCallback(
    ({ index }) => {
      const itemExtraDefOld = itemExtraDefs[index]
      const name = CategoryItemExtraDef.getName(itemExtraDefOld)
      const { newItem } = itemExtraDefOld
      if (newItem) {
        const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(itemExtraDefs)
        updateItemExtraDefs(itemExtraDefsUpdated)
      } else {
        confirm({
          key: 'categoryEdit.extraPropertiesEditor.confirmDelete',
          params: { name },
          onOk: () => {
            const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(itemExtraDefs)
            updateItemExtraDefs(itemExtraDefsUpdated)

            Actions.updateCategoryItemExtraPropItem({
              categoryUuid: Category.getUuid(category),
              name: CategoryItemExtraDef.getName(itemExtraDefOld),
              deleted: true,
            })
          },
        })
      }
    },
    [itemExtraDefs, updateItemExtraDefs]
  )

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
            key={String(index)}
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
        onClick={onAdd}
      />
    </PanelRight>
  )
}
