import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

/**
 * Returns a function that (after confirmation) starts the job generating the Whisp analysis
 * of the sampling point data and storing it in the "sampling_point_data_whisp" category.
 *
 * @returns {Function} The function starting the job.
 */
export const useGenerateSamplingPointDataWhisp = () => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  const startJob = useCallback(async () => {
    const job = await API.startSamplingPointDataWhispJob({ surveyId })
    dispatch(
      JobActions.showJobMonitor({
        job,
        onComplete: (jobCompleted: any) => {
          const { category } = jobCompleted.result ?? {}
          if (category) {
            dispatch(SurveyActions.surveyCategoryInserted(category))
          }
        },
      }) as any
    )
  }, [dispatch, surveyId])

  return useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'categoryEdit.generateSamplingPointDataWhisp.confirmMessage',
        onOk: startJob,
      }) as any
    )
  }, [dispatch, startJob])
}
