import { useCallback, useEffect, useState } from 'react'

import { useIsCategoriesRoute, useOnBrowserBack } from '@webapp/components/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { categoryUuid } = props

  const inCategoriesPath = useIsCategoriesRoute()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const categoryEmpty = State.isCategoryEmpty(state)

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid })
    })()
  }, [])

  if (inCategoriesPath) {
    const deleteCategoryIfEmpty = useCallback(async () => Actions.deleteCategoryIfEmpty({ categoryUuid }), [])

    useOnBrowserBack({
      active: categoryEmpty,
      onBack: deleteCategoryIfEmpty,
    })
  }

  return { state, setState }
}
