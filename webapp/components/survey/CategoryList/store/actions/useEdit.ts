import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import * as Category from '@core/survey/category'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { State } from '../state'

export const useEdit = ({ setState }) => {
  const navigate = useNavigate()

  return useCallback(({ category }) => {
    setState((statePrev) => {
      const onEdit = State.getOnCategoryOpen(statePrev)

      if (onEdit) {
        onEdit(category)
      } else {
        const categoryUuid = Category.getUuid(category)
        navigate(`${appModuleUri(designerModules.category)}${categoryUuid}`)
      }
      return statePrev
    })
  }, [])
}
