import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'
import { ExtraPropDef } from '@core/survey/extraPropDef'

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
            // unlock the 'location' extra prop rather than deleting it, to avoid losing the location
            // value stored on every item; the user can delete it manually afterwards if they want to
            await updateCategoryItemExtraPropItem({
              categoryUuid,
              name: Category.locationItemExtraDefName,
              itemExtraDef: {
                name: Category.locationItemExtraDefName,
                dataType: ExtraPropDef.dataTypes.geometryPoint,
                locked: false,
              },
            })
            updateCategoryProp({ key: Category.keysProps.name, value: '' })
          },
        })
      )
    },
    [dispatch, updateCategoryItemExtraPropItem, updateCategoryProp]
  )
}
