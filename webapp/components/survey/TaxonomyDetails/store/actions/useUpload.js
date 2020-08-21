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

  return useCallback(async ({ state, file }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await API.uploadTaxa({ surveyId, taxonomyUuid, formData })

    await dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: async () => {
          const taxonomyWithTaxa = await API.fetchTaxonomy({ surveyId, taxonomyUuid })
          setState(
            A.pipe(
              State.assocTaxonomy(taxonomyWithTaxa),
              State.assocTaxaVersion(State.getTaxaVersion(state) + 1)
            )(state)
          )
          dispatch(SurveyActions.metaUpdated())
        },
      })
    )
  }, [])
}
