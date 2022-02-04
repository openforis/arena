import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { DialogConfirmActions } from '@webapp/store/ui'

import { useUpdateCategoryProp } from './useUpdateCategoryProp'

export const useConvertToSimpleCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const updateCategoryProp = useUpdateCategoryProp({ setState })

  return useCallback(async () => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.convertToSimpleCategory.confirmMessage',
        onOk: async () => {
          updateCategoryProp({ key: Category.keysProps.reportingData, value: false })
        },
      })
    )
  }, [])
}
