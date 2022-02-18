import { useCallback, useState } from 'react'

import { ArrayUtils } from '@core/arrayUtils'
import * as Category from '@core/survey/category'
import { CategoryItemExtraDef } from '@core/survey/categoryItemExtraDef'

import { useConfirm } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { State, useActions } from '../store'

export const useItemExtraDefsEditor = (props) => {
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

  const onItemAdd = useCallback(async () => {
    const itemExtraDef = {
      ...CategoryItemExtraDef.newItem({ dataType: CategoryItemExtraDef.dataTypes.text }),
      name: '', // name property is used only in UI
      newItem: true,
    }
    updateItemExtraDefs([...itemExtraDefs, itemExtraDef])
  }, [itemExtraDefs])

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

  return {
    Actions,
    i18n,
    itemExtraDefs,
    onItemAdd,
    onItemDelete,
    onItemUpdate,
    readOnly,
  }
}
