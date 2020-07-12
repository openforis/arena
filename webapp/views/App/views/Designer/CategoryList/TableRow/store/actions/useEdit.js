import { useCallback } from 'react'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { State } from '../state'
import { State as ListState } from '../../../store'

export const useEdit = ({ setState }) => {
  const history = useHistory()

  return useCallback(() => {
    setState((state) => {
      const listState = State.getListState(state)
      const onEdit = ListState.getOnEdit(listState)
      const category = State.getCategory(state)
      const categoryUuid = Category.getUuid(category)

      if (onEdit) {
        onEdit(category)
      } else {
        history.push(`${appModuleUri(designerModules.category)}${categoryUuid}`)
      }
      return state
    })
  }, [])
}
