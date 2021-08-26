import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export const useDeleteCategory = () => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid }) => {
    await API.deleteCategory({ surveyId, categoryUuid })
  }, [])
}
