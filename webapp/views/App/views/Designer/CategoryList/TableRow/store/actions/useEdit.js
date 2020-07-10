import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as Category from '@core/survey/category'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as CategoryActions from '@webapp/loggedin/surveyViews/category/actions'

import { State } from '../state'

export const useEdit = () => {
  const dispatch = useDispatch()
  const history = useHistory()

  return useCallback(({ state }) => {
    const inCategoriesPath = State.isInCategoriesPath(state)
    const onEdit = State.getOnEdit(state)
    const category = State.getCategory(state)
    const categoryUuid = Category.getUuid(category)

    if (inCategoriesPath) {
      history.push(`${appModuleUri(designerModules.category)}${categoryUuid}`)
    } else {
      dispatch(CategoryActions.setCategoryForEdit(categoryUuid))
    }
    if (onEdit) {
      onEdit(category)
    }
  }, [])
}
