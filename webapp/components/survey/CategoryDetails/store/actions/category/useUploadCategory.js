import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as A from '@core/arena'

import { FileUtils } from '@webapp/utils/fileUtils'
import { useSurveyId } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'
import { objectToFormData } from '@webapp/service/api'

import { State } from '../../state'

export const useUploadCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(
    async ({ categoryUuid, file, onUploadProgress }) => {
      const fileFormat = FileUtils.determineFileFormatFromFileName(file.name)
      const formData = objectToFormData({ file, fileFormat })
      const {
        data: { summary, error },
      } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/upload`, formData, {
        onUploadProgress,
      })
      if (error) {
        const { key, params } = error
        dispatch(NotificationActions.notifyError({ key: key ?? error, params }))
      } else if (summary) {
        setState(A.pipe(State.assocImportSummary({ summary }), State.assocFileFormat({ fileFormat })))
      }
    },
    [dispatch, setState, surveyId]
  )
}
