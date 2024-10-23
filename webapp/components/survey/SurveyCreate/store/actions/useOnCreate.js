import { useDispatch } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'
import { StatusCodes } from '@core/systemError'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'
import * as API from '@webapp/service/api'
import { useCallback } from 'react'

const sendSurveyCreateRequest = async ({ dispatch, newSurvey, user }) => {
  try {
    const { surveyId: cloneFromSurveyId } = newSurvey.cloneFrom || {}

    return await API.insertSurvey({ newSurvey: { ...newSurvey, cloneFrom: cloneFromSurveyId } })
  } catch (e) {
    let errorKey = null,
      errorParams = null
    if (e.status === StatusCodes.UNAUTHORIZED) {
      const maxSurveysCount = Authorizer.getMaxSurveysUserCanCreate(user)
      errorKey = 'surveyCreate:errorMaxSurveysCountExceeded'
      errorParams = { maxSurveysCount }
    } else {
      errorKey = 'surveyCreate:error'
    }
    dispatch(NotificationActions.notifyError({ key: errorKey, params: errorParams }))
    return null
  }
}

export const useOnCreate = ({ newSurvey, setNewSurvey }) => {
  const dispatch = useDispatch()
  const user = useUser()

  const create = useCallback(async () => {
    dispatch(LoaderActions.showLoader())
    const data = await sendSurveyCreateRequest({ dispatch, newSurvey, user })
    dispatch(LoaderActions.hideLoader())
    if (!data) {
      return
    }
    const { job, survey, validation } = data
    if (job) {
      dispatch(
        JobActions.showJobMonitor({
          job,
          onComplete: async (_job) => {
            const { surveyId } = JobSerialized.getResult(_job)
            dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
          },
        })
      )
    } else if (survey) {
      dispatch(SurveyActions.createSurvey({ survey }))
    } else {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))

      setNewSurvey({
        ...newSurvey,
        validation,
      })
    }
  }, [dispatch, newSurvey, setNewSurvey, user])
  return create
}
