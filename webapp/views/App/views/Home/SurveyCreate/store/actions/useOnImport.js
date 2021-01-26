import axios from 'axios'
import { useDispatch } from 'react-redux'

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
export const useOnImport = ({ source = importSources.collect }) => {
  const dispatch = useDispatch()

  return ({ file }) => {
    ;(async () => {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await axios.post(urlBasedOnSource[source], formData)

      dispatch(
        JobActions.showJobMonitor({
          job: data.job,
          onComplete: async (job) => {
            const { surveyId } = JobSerialized.getResult(job)
            dispatch(SurveyActions.setActiveSurvey(surveyId, true, true))
          },
        })
      )
    })()
  }
}
