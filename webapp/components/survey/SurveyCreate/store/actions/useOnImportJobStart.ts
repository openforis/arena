import { useCallback } from 'react'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Validation from '@core/validation/validation'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import { NotificationActions } from '@webapp/store/ui'
import { useAppDispatch } from '@webapp/store'

export const useOnImportJobStart = ({ setNewSurvey }) => {
  const dispatch = useAppDispatch()

  return useCallback(
    ({ job, validation }) => {
      const formHasErrors = validation && !Validation.isValid(validation)

      if (formHasErrors) {
        dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))

        setNewSurvey((prevNewSurvey) => ({ ...prevNewSurvey, validation, uploading: false }))
      } else if (job) {
        dispatch(
          JobActions.showJobMonitor({
            job,
            onComplete: (jobCompleted) => {
              const { surveyId } = JobSerialized.getResult(jobCompleted)
              dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
            },
          })
        )
      }
    },
    [dispatch, setNewSurvey]
  )
}
