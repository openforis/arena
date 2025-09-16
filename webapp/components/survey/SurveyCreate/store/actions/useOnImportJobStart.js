import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Validation from '@core/validation/validation'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { NotificationActions } from '@webapp/store/ui'

export const useOnImportJobStart = ({ newSurvey, setNewSurvey }) => {
  const dispatch = useDispatch()

  return useCallback(
    ({ job, validation }) => {
      const formHasErrors = validation && !Validation.isValid(validation)

      if (formHasErrors) {
        dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))

        setNewSurvey({
          ...newSurvey,
          validation,
          uploading: false,
        })
      } else if (job) {
        dispatch(
          JobActions.showJobMonitor({
            job,
            onComplete: async (jobCompleted) => {
              const { surveyId } = JobSerialized.getResult(jobCompleted)
              dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
            },
          })
        )
      }
    },
    [dispatch]
  )
}
