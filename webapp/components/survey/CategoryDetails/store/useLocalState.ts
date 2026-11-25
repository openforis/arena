import { useCallback, useEffect, useState } from 'react'

import { notifySuggestionEvent } from '@webapp/ai/suggestions/suggestionEvents'
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
    void (async () => {
      await Actions.init({ categoryUuid, onCategoryUpdate })
    })()
    // labels typed in the editor change the missing counts (suggestion 6)
    return () => notifySuggestionEvent({ type: 'categoryEditorLeft' })
  }, [])

  const cleanupCategory = useCallback(() => Actions.cleanupCategory({ categoryUuid }), [])

  useOnBrowserBack({
    active: inCategoriesPath && canEdit && !categoryCleaned,
    onBack: cleanupCategory,
  })

  return { state, setState }
}
