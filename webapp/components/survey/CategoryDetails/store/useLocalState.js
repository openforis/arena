import { useCallback, useEffect, useState } from 'react'

import { useIsCategoriesRoute, useOnBrowserBack } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import { useActions } from './actions'
import { State } from './state'

export const useLocalState = (props) => {
  const { categoryUuid, onCategoryUpdate } = props

  const inCategoriesPath = useIsCategoriesRoute()
  const canEdit = useAuthCanEditSurvey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const categoryCleaned = State.isCleaned(state)

  useEffect(() => {
    ;(async () => {
      await Actions.init({ state, categoryUuid, onCategoryUpdate })
    })()
  }, [])

  if (inCategoriesPath) {
    const cleanupCategory = useCallback(async () => Actions.cleanupCategory({ categoryUuid }), [])

    useOnBrowserBack({
      active: canEdit && !categoryCleaned,
      onBack: cleanupCategory,
    })
  }

  return { state, setState }
}
