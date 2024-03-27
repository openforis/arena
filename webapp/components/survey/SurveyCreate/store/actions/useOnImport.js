import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as JobSerialized from '@common/job/jobSerialized'

import * as Validation from '@core/validation/validation'

import { objectToFormData } from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { SurveyActions } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'

import { importSources } from '../importSources'

const urlBySource = {
  [importSources.collect]: '/api/survey/collect-import',
  [importSources.arena]: '/api/survey/arena-import',
}

export const useOnImport = ({ newSurvey, setNewSurvey }) => {
  const dispatch = useDispatch()

  return useCallback(async () => {
    const { file, source, ...surveyObj } = newSurvey

    // reset upload progress (hide progress bar)
    setNewSurvey({ ...newSurvey, uploadProgressPercent: -1, uploading: true })

    const formData = objectToFormData({ file, survey: JSON.stringify(surveyObj) })

    const onUploadProgress = (progressEvent) => {
      const uploadProgressPercent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      setNewSurvey({ ...newSurvey, uploadProgressPercent, uploading: uploadProgressPercent < 100 })
    }
    const { data } = await axios.post(urlBySource[source], formData, { onUploadProgress })

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
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotContinue' }))

      setNewSurvey({
        ...newSurvey,
        validation,
        uploading: false,
      })
    }
  }, [dispatch, newSurvey, setNewSurvey])
}
