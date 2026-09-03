import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useUpdateCategoryItemExtraPropItem } from './useUpdateCategoryItemExtraPropItem'

export const useConvertGeoPackageCategoryToSimple = ({ setState }) => {
  const dispatch = useDispatch()
  const updateCategoryItemExtraPropItem = useUpdateCategoryItemExtraPropItem({ setState })

  return useCallback(
    (categoryUuid) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'categoryEdit.convertGeoPackageCategoryToSimple.confirmMessage',
          onOk: async () => {
            await updateCategoryItemExtraPropItem({
              categoryUuid,
              name: Category.locationItemExtraDefName,
              deleted: true,
            })
          },
        })
      )
    },
    [dispatch, updateCategoryItemExtraPropItem]
  )
}
