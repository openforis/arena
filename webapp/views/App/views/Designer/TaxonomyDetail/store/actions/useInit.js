import { useCallback } from 'react'
import { useParams } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'
import * as A from '@core/arena'

import * as Taxonomy from '@core/survey/taxonomy'
import { TaxonomiesActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'
import * as TaxonomyActions from '../../actions'
import * as TaxonomyState from '../../taxonomyState'

export const useInit = ({ setState }) => {
  const dispatch = useDispatch()

  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const surveyId = useSurveyId()

  const taxonomy = useSelector(TaxonomyState.getTaxonomy)

  return useCallback(async ({ onTaxonomyCreated }) => {
    let taxonomyToSet = taxonomy

    if (A.isEmpty(taxonomyToSet)) {
      if (A.isEmpty(taxonomyUuidParam)) {
        const {
          data: { taxonomyCreated },
        } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

        if (onTaxonomyCreated) {
          onTaxonomyCreated(taxonomyCreated)
        }
        await dispatch({ type: TaxonomiesActions.taxonomyCreate, taxonomy })
        taxonomyToSet = taxonomyCreated
      } else {
        const {
          data: { taxonomy: taxonomyFetched },
        } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuidParam}?draft=true&validate=true`)
        taxonomyToSet = taxonomyFetched
      }
    }

    setState(State.create({ taxonomy: taxonomyToSet }))
    dispatch(TaxonomyActions.setTaxonomyForEdit(Taxonomy.getUuid(taxonomyToSet)))
  }, [])
}
