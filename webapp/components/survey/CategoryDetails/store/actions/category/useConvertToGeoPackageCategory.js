import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { useInit } from './useInit'

export const useConvertToGeoPackageCategory = ({ setState }) => {
  const surveyId = useSurveyId()
  const init = useInit({ setState })

  return useCallback(
    async ({ categoryUuid, locked, onCategoryUpdate }) => {
      await API.convertToGeoPackageCategory({ surveyId, categoryUuid, locked })
      await init({ categoryUuid, onCategoryUpdate })
    },
    [surveyId, init]
  )
}
