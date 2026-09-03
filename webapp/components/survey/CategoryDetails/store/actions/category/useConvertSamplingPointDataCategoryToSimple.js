import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useUpdateCategoryProp } from './useUpdateCategoryProp'
import { useUpdateCategoryItemExtraPropItem } from './useUpdateCategoryItemExtraPropItem'

export const useConvertSamplingPointDataCategoryToSimple = ({ setState }) => {
  const dispatch = useDispatch()
  const updateCategoryProp = useUpdateCategoryProp({ setState })
  const updateCategoryItemExtraPropItem = useUpdateCategoryItemExtraPropItem({ setState })

  return useCallback(
    (categoryUuid) => {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'categoryEdit.convertSamplingPointDataCategoryToSimple.confirmMessage',
          onOk: async () => {
            await updateCategoryItemExtraPropItem({
              categoryUuid,
              name: Category.locationItemExtraDefName,
              deleted: true,
            })
            updateCategoryProp({ key: Category.keysProps.name, value: '' })
          },
        })
      )
    },
    [dispatch, updateCategoryItemExtraPropItem, updateCategoryProp]
  )
}
