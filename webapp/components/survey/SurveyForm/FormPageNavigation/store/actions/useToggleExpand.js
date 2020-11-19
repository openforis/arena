import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

export const useToggleExpand = () => {
  const dispatch = useDispatch()
  return useCallback(() => {
    dispatch(SurveyFormActions.toggleExpandedFormPageNavigation())
  }, [])
}
