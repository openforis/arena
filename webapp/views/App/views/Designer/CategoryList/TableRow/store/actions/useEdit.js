import { useCallback } from 'react'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { State } from '../state'

export const useEdit = () => {
  const history = useHistory()

  return useCallback(({ state }) => {
    const onEdit = State.getOnEdit(state)
    const category = State.getCategory(state)
    const categoryUuid = Category.getUuid(category)

    if (onEdit) {
      onEdit(category)
    } else {
      history.push(`${appModuleUri(designerModules.category)}${categoryUuid}`)
    }
  }, [])
}
