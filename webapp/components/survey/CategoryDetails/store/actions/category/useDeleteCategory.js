import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export const useDeleteCategoryIfEmpty = () => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid }) => API.deleteCategoryIfEmpty({ surveyId, categoryUuid }), [])
}
