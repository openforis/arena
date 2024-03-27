import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Authorizer from '@core/auth/authorizer'

import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { SurveyActions } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'

const sendSurveyCreateRequest = async ({ dispatch, newSurvey, user }) => {
  try {
    const { surveyId: cloneFromSurveyId } = newSurvey.cloneFrom || {}

    return await API.insertSurvey({ newSurvey: { ...newSurvey, cloneFrom: cloneFromSurveyId } })
  } catch (e) {
    const maxSurveysCount = Authorizer.getMaxSurveysUserCanCreate(user)
    const errorKey = Number.isNaN(maxSurveysCount)
      ? 'homeView.surveyCreate.error'
      : 'homeView.surveyCreate.errorMaxSurveysCountExceeded'
    dispatch(
      NotificationActions.notifyError({
        key: errorKey,
        params: { maxSurveysCount },
      })
    )
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
