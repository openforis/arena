import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useRefreshCategory } from './useRefreshCategory'

export const useUpdateCategoryItemExtraPropItem = ({ setState }) => {
  const surveyId = useSurveyId()
  const refreshCategory = useRefreshCategory({ setState })

  return useCallback(async ({ categoryUuid, name, itemExtraDef = null, deleted = false }) => {
    const category = await API.updateCategoryItemExtraDefItem({ surveyId, categoryUuid, name, itemExtraDef, deleted })

    refreshCategory({ category })
  }, [])
}
