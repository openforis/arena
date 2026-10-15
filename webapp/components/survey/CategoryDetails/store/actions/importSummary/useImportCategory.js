import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Category from '@core/survey/category'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { FileUploadDialogActions } from '@webapp/store/ui'

import { useRefreshCategory } from '../category/useRefreshCategory'
import { State } from '../../state'

export const useImportCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const refreshCategory = useRefreshCategory({ setState })

  return useCallback(
    async ({ state }) => {
      const category = State.getCategory(state)
      const categoryUuid = Category.getUuid(category)
      const importSummary = State.getImportSummary(state)
      const fileFormat = State.getFileFormat(state)
      const data = { fileFormat, ...importSummary }

      const {
        data: { job },
      } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, data)

      dispatch(
        JobActions.showJobMonitor({
          job,
          onComplete: (jobCompleted) => {
            const categoryUpdated = jobCompleted.result.category
            refreshCategory({ category: categoryUpdated })
            dispatch(SurveyActions.surveyCategoryUpdated(categoryUpdated))
            dispatch(FileUploadDialogActions.close())
          },
        })
      )
    },
    [dispatch, refreshCategory, surveyId]
  )
}
