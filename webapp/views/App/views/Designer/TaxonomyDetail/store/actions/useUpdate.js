import axios from 'axios'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'

import { useSurveyId, TaxonomiesActions } from '@webapp/store/survey'

import { State } from '../state'

export const useUpdate = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(({ key, value, state }) => {
    const taxonomy = State.getTaxonomy(state)

    const taxonomyUpdated = State.assocTaxonomyProp({ key, value })(taxonomy)
    setState(State.assocTaxonomy(taxonomyUpdated)(state))

    const action = async () => {
      dispatch({ type: TaxonomiesActions.taxonomyPropUpdate, taxonomy, key, value })
      const { data } = await axios.put(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`, {
        key,
        value,
      })
      dispatch({ type: TaxonomiesActions.taxonomiesUpdate, taxonomies: data.taxonomies })
    }

    dispatch(debounceAction(action, `${TaxonomiesActions.taxonomyPropUpdate}_${Taxonomy.getUuid(taxonomy)}`))
  }, [])
}
