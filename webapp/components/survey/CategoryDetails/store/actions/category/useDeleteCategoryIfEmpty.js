import { useCallback } from 'react'
import { useHistory } from 'react-router'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

export const useDeleteCategoryIfEmpty = ({ setState }) => {
  const history = useHistory()
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid }) => {
    await API.deleteCategoryIfEmpty({ surveyId, categoryUuid })
    setState({})
    history.goBack()
    return true // returns true to notify the navigation to the previous page
  }, [])
}
