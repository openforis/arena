import axios from 'axios'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Taxonomy from '@core/survey/taxonomy'

import { JobActions } from '@webapp/store/app'
import { useSurveyId, TaxonomiesActions } from '@webapp/store/survey'

import { State } from '../state'

export const useUpload = ({ setState }) => {
  const dispatch = useDispatch()

  const surveyId = useSurveyId()

  return useCallback(async ({ state, file }) => {
    const taxonomy = State.getTaxonomy(state)
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await axios.post(
      `/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}/upload`,
      formData
    )

    await dispatch(
      JobActions.showJobMonitor({
        job: data.job,
        onComplete: () => {
          setState(State.assocTaxaVersion(State.getTaxaVersion(state) + 1)(state))
        },
      })
    )

    const {
      data: { taxonomyWithTaxa },
    } = await axios.get(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}?draft=true&validate=true`)

    dispatch({ type: TaxonomiesActions.taxonomyUpdate, taxonomyWithTaxa })
    setState(State.assocTaxonomy(taxonomyWithTaxa)(state))
  }, [])
}
