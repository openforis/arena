import { useCallback } from 'react'

import { Authorizer } from '@openforis/arena-core'

import * as JobSerialized from '@common/job/jobSerialized'
import { StatusCodes } from '@core/systemError'
import * as API from '@webapp/service/api'
import { useAppDispatch } from '@webapp/store'
import { JobActions } from '@webapp/store/app'
import { SurveyActions } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'

const sendSurveyCreateRequest = ({ newSurvey }) => {
  const { surveyId: cloneFromSurveyId } = newSurvey.cloneFrom || {}
  return API.insertSurvey({ newSurvey: { ...newSurvey, cloneFrom: cloneFromSurveyId } })
}

export const useOnCreate = ({ newSurvey, setNewSurvey }) => {
  const dispatch = useAppDispatch()
  const user = useUser()

  const create = useCallback(async () => {
    dispatch(LoaderActions.showLoader())
    try {
      const data = await sendSurveyCreateRequest({ newSurvey })
      const { job, survey, validation } = data
      if (job) {
        dispatch(
          JobActions.showJobMonitor({
            job,
            onComplete: (_job) => {
              const { surveyId } = JobSerialized.getResult(_job)
              dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
            },
            autoHide: true,
          })
        )
      } else if (survey) {
        dispatch(SurveyActions.createSurvey({ survey }))
      } else {
        dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))
        setNewSurvey({ ...newSurvey, validation })
      }
    } catch (e) {
      if (e.status === StatusCodes.FORBIDDEN) {
        const maxSurveysCount = Authorizer.getMaxSurveysUserCanCreate(user)
        dispatch(
          NotificationActions.notifyError({
            key: 'surveyCreate:errorMaxSurveysCountExceeded',
            params: { maxSurveysCount },
          })
        )
      } else {
        dispatch(NotificationActions.notifyError({ key: 'surveyCreate:error' }))
      }
    } finally {
      dispatch(LoaderActions.hideLoader())
    }
  }, [dispatch, newSurvey, setNewSurvey, user])
  return create
}
