import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Taxonomy from '@core/survey/taxonomy'

import * as API from '@webapp/service/api'
import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

import { useRefreshTaxonomy } from './useRefreshTaxonomy'

export const useUpload = ({ setState }) => {
  const dispatch = useDispatch()

  const refreshTaxonomy = useRefreshTaxonomy({ setState })
  const surveyId = useSurveyId()

  const onUploadComplete = async ({ taxonomyUuid }) => {
    await refreshTaxonomy({ taxonomyUuid })
    dispatch(SurveyActions.metaUpdated())
  }

  return useCallback(async ({ state, file }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    const formData = API.objectToFormData({ file })

    const { data } = await API.uploadTaxa({ surveyId, taxonomyUuid, formData })

    await dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: async () => onUploadComplete({ taxonomyUuid }),
      })
    )
  }, [])
}
