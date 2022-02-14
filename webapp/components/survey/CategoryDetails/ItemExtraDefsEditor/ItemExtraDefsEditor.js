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

  const category = State.getCategory(categoryState)

  const calculateInitialState = useCallback(() => {
    const itemExtraDefsSaved = Category.getItemExtraDef(category)
    return {
      itemExtraDefs: Object.entries(itemExtraDefsSaved).map(([name, extraDef]) => ({ ...extraDef, name })),
    }
  }, [category])

  const [state, setState] = useState(calculateInitialState())

  const { itemExtraDefs } = state

  const updateItemExtraDefs = useCallback(
    async (itemExtraDefsUpdated) => {
      const itemExtraDefsIndexed = itemExtraDefsUpdated.reduce(
        (acc, itemExtraDef) => ({
          ...acc,
          [itemExtraDef.name]: CategoryItemExtraDef.newItem({ dataType: itemExtraDef.dataType }),
        }),
        {}
      )
      Actions.updateCategoryProp({ key: Category.keysProps.itemExtraDef, value: itemExtraDefsIndexed })
    },
    [setState]
  )

  const onAdd = useCallback(async () => {
    const itemExtraDef = {
      ...CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.text }),
      name: '', // name property is used only in UI
      newItem: true,
    }
    setState((statePrev) => ({ ...statePrev, itemExtraDefs: [...itemExtraDefs, itemExtraDef] }))
  }, [itemExtraDefs])

  const onItemUpdate = useCallback(
    async ({ index, itemExtraDefUpdated }) => {
      const itemExtraDefsUpdated = [...itemExtraDefs]
      itemExtraDefsUpdated[index] = itemExtraDefUpdated
      updateItemExtraDefs(itemExtraDefsUpdated)
    },
    [itemExtraDefs, updateItemExtraDefs]
  )

  const onItemDelete = useCallback(
    ({ index }) => {
      // TODO confirm
      const itemExtraDefsUpdated = ArrayUtils.removeItemAtIndex({ index })(itemExtraDefs)
      updateItemExtraDefs(itemExtraDefsUpdated)
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
      <ButtonAdd className="item-add-btn" disabled={readOnly} onClick={onAdd} />
    </PanelRight>
  )
}
