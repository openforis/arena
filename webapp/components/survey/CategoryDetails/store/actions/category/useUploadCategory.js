import { useCallback } from 'react'
import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'
import { objectToFormData } from '@webapp/service/api'

import { State } from '../../state'

export const useUploadCategory = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, file }) => {
    const formData = objectToFormData({ file })

    const { data: summary } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData)

    setState(State.assocImportSummary({ summary }))
  }, [])
}
