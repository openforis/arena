import { useCallback } from 'react'

import * as Category from '@core/survey/category'

import { useNavigator } from '@webapp/app/useNavigator'
import { State } from '../state'

export const useEdit = ({ setState }) => {
  const { navigateToCategoryDetails } = useNavigator()

  return useCallback(
    ({ category }) => {
      setState((statePrev) => {
        const onEdit = State.getOnCategoryOpen(statePrev)

        if (onEdit) {
          onEdit(category)
        } else {
          const categoryUuid = Category.getUuid(category)
          navigateToCategoryDetails({ categoryUuid })
        }
        return statePrev
      })
    },
    [navigateToCategoryDetails, setState]
  )
}
