import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'

export const useConvertToGeoPackageCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const init = useInit({ setState })

  return useCallback(
    async ({ categoryUuid, onCategoryUpdate }) => {
      const category = await API.convertToGeoPackageCategory({ surveyId, categoryUuid })

      dispatch(SurveyActions.surveyCategoryUpdated(category))
      dispatch(SurveyActions.metaUpdated())

      await init({ categoryUuid, onCategoryUpdate })
    },
    [surveyId, init, dispatch]
  )
}
