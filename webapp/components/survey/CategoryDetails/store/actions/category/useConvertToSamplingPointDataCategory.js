import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useNotifyError } from '@webapp/components/hooks'
import { useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'

export const useConvertToSamplingPointDataCategory = ({ setState }) => {
  const surveyId = useSurveyId()
  const init = useInit({ setState })
  const notifyError = useNotifyError()

  return useCallback(
    async ({ categoryUuid, locked, onCategoryUpdate }) => {
      try {
        await API.convertToSamplingPointDataCategory({ surveyId, categoryUuid, locked })
        await init({ categoryUuid, onCategoryUpdate })
      } catch (error) {
        const { key, params } = error?.response?.data ?? {}
        notifyError({ key: key ?? 'appErrors:generic', params })
      }
    },
    [surveyId, init, notifyError]
  )
}
