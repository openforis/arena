import { useCallback } from 'react'
import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useUploadCategory = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, file }) => {
    const formData = new FormData()
    formData.append('file', file)

    const { data: summary } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData)

    setState(State.assocImportSummary({ summary }))
  }, [])
}
