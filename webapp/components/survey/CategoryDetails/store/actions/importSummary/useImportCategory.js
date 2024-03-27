import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as Category from '@core/survey/category'

import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'
import { FileUploadDialogActions } from '@webapp/store/ui'

import { State } from '../../state'
import { useRefreshCategory } from '../category/useRefreshCategory'

export const useImportCategory = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const refreshCategory = useRefreshCategory({ setState })

  return useCallback(async ({ state }) => {
    const category = State.getCategory(state)
    const categoryUuid = Category.getUuid(category)
    const importSummary = State.getImportSummary(state)

    const {
      data: { job },
    } = await axios.post(`/api/survey/${surveyId}/categories/${categoryUuid}/import`, importSummary)

    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobCompleted) => {
          refreshCategory({ category: jobCompleted.result.category })
          dispatch(FileUploadDialogActions.close())
        },
      })
    )
  }, [])
}
