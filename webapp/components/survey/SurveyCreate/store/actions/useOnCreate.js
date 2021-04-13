import axios from 'axios'
import { useDispatch } from 'react-redux'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'

export const useOnCreate = ({ newSurvey, setNewSurvey }) => {
  const dispatch = useDispatch()

  return () => {
    ;(async () => {
      const { name, label, lang, cloneFrom = false, template = false } = newSurvey

      const {
        data: { job, survey, validation },
      } = await axios.post('/api/survey', { name, label, lang, cloneFrom, template })

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
