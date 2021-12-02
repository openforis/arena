import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

export const useCleanupCategory = ({ setState }) => {
  const navigate = useNavigate()
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid }) => {
    await API.cleanupCategory({ surveyId, categoryUuid })
    setState(State.assocCleaned)
    navigate.go(-1)
    return true // returns true to notify the navigation to the previous page
  }, [])
}
