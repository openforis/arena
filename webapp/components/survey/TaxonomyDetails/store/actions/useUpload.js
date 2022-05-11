import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'

import * as Taxonomy from '@core/survey/taxonomy'

import * as API from '@webapp/service/api'

import { JobActions } from '@webapp/store/app'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useUpload = ({ setState }) => {
  const dispatch = useDispatch()

  const surveyId = useSurveyId()

  const onUploadComplete = async ({ taxonomyUuid }) => {
    const taxonomy = await API.fetchTaxonomy({ surveyId, taxonomyUuid })
    setState((statePrev) => {
      const taxaVersionPrev = State.getTaxaVersion(statePrev)
      return A.pipe(State.assocTaxonomy(taxonomy), State.assocTaxaVersion(taxaVersionPrev + 1))(statePrev)
    })
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
