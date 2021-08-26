import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router'

import { useIsCategoriesRoute, useOnBrowserBack } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { categoryUuid } = props

  const history = useHistory()

  const inCategoriesPath = useIsCategoriesRoute()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const categoryEmpty = State.isCategoryEmpty(state)

  const deleteCategoryIfEmpty = useCallback(async () => {
    await Actions.deleteCategoryIfEmpty({ categoryUuid })
    setState({})
    history.goBack()
    return true
  }, [])

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid })
    })()
  }, [])

  if (inCategoriesPath) {
    useOnBrowserBack({
      active: categoryEmpty,
      onBack: deleteCategoryIfEmpty,
    })
  }

  return { state, setState }
}
