import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'

import { SurveyActions } from '@webapp/store/survey'
import { JobActions } from '@webapp/store/app'
import * as JobSerialized from '@common/job/jobSerialized'

export const importSources = {
  collect: 'collect',
  arena: 'arena',
}
const urlBasedOnSource = {
  [importSources.collect]: '/api/survey/collect-import',
  [importSources.arena]: '/api/survey/arena-import',
}
export const useOnImport = ({ newSurvey, setNewSurvey, source = importSources.collect }) => {
  const dispatch = useDispatch()

  return ({ file }) => {
    ;(async () => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('survey', JSON.stringify(newSurvey))

      const { data } = await axios.post(urlBasedOnSource[source], formData)
      const { job, validation } = data

      if (job && (!validation || Validation.isValid(validation))) {
        dispatch(
          JobActions.showJobMonitor({
            job: data.job,
            onComplete: async (job) => {
              const { surveyId } = JobSerialized.getResult(job)
              dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
            },
          })
        )
      } else if (validation && !Validation.isValid(validation)) {
        setNewSurvey({
          ...newSurvey,
          validation,
        })
      }
    })()
  }
}
