import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useNotifyError } from '@webapp/components/hooks'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'
import { useAppDispatch } from '@webapp/store'

export const useConvertToSamplingPointDataCategory = ({ setState }) => {
  const dispatch = useAppDispatch()
  const surveyId = useSurveyId()
  const init = useInit({ setState })
  const notifyError = useNotifyError()

  return useCallback(
    async ({ categoryUuid, onCategoryUpdate }) => {
      try {
        const category = await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid })

        dispatch(SurveyActions.surveyCategoryUpdated(category))
        dispatch(SurveyActions.metaUpdated())

        await init({ categoryUuid, onCategoryUpdate })
      } catch (error) {
        const { key, params } = error?.response?.data ?? {}
        notifyError({ key: key ?? 'appErrors:generic', params })
      }
    },
    [surveyId, init, notifyError, dispatch]
  )
}
