import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'

import * as Validation from '@core/validation/validation'

import { objectToFormData } from '@webapp/service/api'
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

  return useCallback(
    async ({ file }) => {
      const formData = objectToFormData({ file, survey: JSON.stringify(newSurvey) })

      const onUploadProgress = (progressEvent) => {
        const uploadProgressPercent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        setNewSurvey({ ...newSurvey, uploadProgressPercent })
      }
      const { data } = await axios.post(urlBasedOnSource[source], formData, { onUploadProgress })

      // reset upload progress (hide progress bar)
      setNewSurvey({ ...newSurvey, uploadProgressPercent: -1 })

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
    },
    [dispatch, newSurvey, setNewSurvey, source]
  )
}
