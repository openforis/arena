import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'
import { NotificationActions } from '@webapp/store/ui'
import { useUser } from '@webapp/store/user'

const sendSurveyCreateRequest = async ({ dispatch, newSurvey, user }) => {
  const { name, label, lang, cloneFrom = false, template = false } = newSurvey
  try {
    const { data } = await axios.post('/api/survey', { name, label, lang, cloneFrom, template })
    return data
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

  return () => {
    ;(async () => {
      const data = await sendSurveyCreateRequest({ dispatch, newSurvey, user })
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
        setNewSurvey({
          ...newSurvey,
          validation,
        })
      }
    })()
  }
}
