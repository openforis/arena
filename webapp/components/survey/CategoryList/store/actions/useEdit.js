import { useCallback } from 'react'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { State } from '../state'

export const useEdit = ({ setState }) => {
  const history = useHistory()

  return useCallback(({ category }) => {
    setState((statePrev) => {
      const onEdit = State.getOnEdit(statePrev)

      if (onEdit) {
        onEdit(category)
      } else {
        const categoryUuid = Category.getUuid(category)
        history.push(`${appModuleUri(designerModules.category)}${categoryUuid}`)
      }
      return statePrev
    })
  }, [])
}
