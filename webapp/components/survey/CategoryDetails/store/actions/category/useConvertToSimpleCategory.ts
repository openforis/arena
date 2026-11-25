import { useCallback } from 'react'

import * as Category from '@core/survey/category'
import { useAppDispatch } from '@webapp/store'
import { DialogConfirmActions } from '@webapp/store/ui'

import { useUpdateCategoryProp } from './useUpdateCategoryProp'

export const useConvertToSimpleCategory = ({ setState }) => {
  const dispatch = useAppDispatch()
  const updateCategoryProp = useUpdateCategoryProp({ setState })

  return useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.convertToSimpleCategory.confirmMessage',
        onOk: () => {
          updateCategoryProp({ key: Category.keysProps.reportingData, value: false })
        },
      })
    )
  }, [])
}
