import { useCallback } from 'react'
import { useParams } from 'react-router'
import { useDispatch } from 'react-redux'

import axios from 'axios'

import * as A from '@core/arena'

import * as Taxonomy from '@core/survey/taxonomy'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useInit = ({ setState }) => {
  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ onTaxonomyCreated, taxonomy }) => {
    let taxonomyToSet = taxonomy

    if (A.isEmpty(taxonomyToSet)) {
      if (A.isEmpty(taxonomyUuidParam)) {
        const {
          data: { taxonomy: taxonomyCreated },
        } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

        if (onTaxonomyCreated) {
          onTaxonomyCreated(taxonomyCreated)
        }
        taxonomyToSet = taxonomyCreated
        dispatch(SurveyActions.metaUpdated())
      } else {
        const {
          data: { taxonomy: taxonomyFetched },
        } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuidParam}?draft=true&validate=true`)
        taxonomyToSet = taxonomyFetched
      }
    }

    setState(State.create({ taxonomy: taxonomyToSet }))
  }, [])
}
