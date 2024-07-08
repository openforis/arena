import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import { useSurveyId } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'
import { objectToFormData } from '@webapp/service/api'

import { State } from '../../state'

export const useUploadCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(
    async ({ categoryUuid, file, onUploadProgress }) => {
      const formData = objectToFormData({ file })

      const {
        data: { summary, error },
      } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData, {
        onUploadProgress,
      })
      if (error) {
        const { key, params } = error
        dispatch(NotificationActions.notifyError({ key, params }))
      } else if (summary) {
        setState(State.assocImportSummary({ summary }))
      }
    },
    [dispatch, setState, surveyId]
  )
}
