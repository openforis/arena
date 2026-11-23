import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'
import { useAppDispatch } from '@webapp/store'

export const useConvertToGeoPackageCategory = ({ setState }) => {
  const dispatch = useAppDispatch()
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
