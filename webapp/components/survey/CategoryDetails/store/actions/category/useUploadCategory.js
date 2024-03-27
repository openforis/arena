import { useCallback } from 'react'
import axios from 'axios'

import { objectToFormData } from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

export const useUploadCategory = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, file, onUploadProgress }) => {
    const formData = objectToFormData({ file })

    const { data: summary } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData, {
      onUploadProgress,
    })

    setState(State.assocImportSummary({ summary }))
  }, [])
}
