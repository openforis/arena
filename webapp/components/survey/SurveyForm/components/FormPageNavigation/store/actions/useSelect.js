import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { SurveyFormActions } from '@webapp/store/ui/surveyForm'

import { State } from '../state'

export const useSelect = () => {
  const dispatch = useDispatch()

  return useCallback(async ({ state }) => {
    const nodeDef = State.getNodeDef(state)

    dispatch(SurveyFormActions.setFormActivePage(nodeDef))
  }, [])
}
