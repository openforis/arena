import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Category from '@core/survey/category'

import { useActions } from './actions'
import { State } from './state'
import { useOnBrowserBack } from '@webapp/components/hooks'

export const useLocalState = (props) => {
  const { categoryUuid } = props

  const history = useHistory()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const isCategoryEmpty = () => {
    const category = State.getCategory(state)
    return (
      category &&
      StringUtils.isBlank(Category.getName(category)) &&
      Category.getLevelsArray(category).length === 1 &&
      State.getItemsArray({ levelIndex: 1 })(state).length === 0
    )
  }

  const categoryEmpty = isCategoryEmpty()

  const deleteCategory = useCallback(async () => {
    await Actions.deleteCategory()
    setState({})
    history.goBack()
    return true
  }, [])

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid })
    })()
  }, [])

  useOnBrowserBack({
    active: categoryEmpty,
    onBack: deleteCategory,
  })

  return { state, setState }
}
