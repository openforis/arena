import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { useSurveyId } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'

export const useStartBatchImport = ({ setState }) => {
  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  const onJobComplete = useCallback(
    async (job) => {
      const { importedCategories, insertedCategories, updatedCategories } = JobSerialized.getResult(job)
      setState({ categoriesRequestedAt: Date.now() })
      dispatch(
        NotificationActions.notifyInfo({
          key: 'categoryList.batchImportCompleteSuccessfully',
          params: { importedCategories, insertedCategories, updatedCategories },
        })
      )
    },
    [dispatch, setState]
  )

  return useCallback(
    async ({ file }) => {
      const { job } = await API.startCategoriesBatchImportJob({ surveyId, file })
      dispatch(JobActions.showJobMonitor({ job, onComplete: onJobComplete, autoHide: true }))
    },
    [dispatch, onJobComplete, surveyId]
  )
}
