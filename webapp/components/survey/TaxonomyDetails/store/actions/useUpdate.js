import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { debounceAction } from '@webapp/utils/reduxUtils'
import * as Taxonomy from '@core/survey/taxonomy'

import * as API from '@webapp/service/api'

import { useSurveyId, SurveyActions } from '@webapp/store/survey'

import { State } from '../state'

export const useUpdate = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(({ key, value, state }) => {
    const taxonomy = State.getTaxonomy(state)
    const taxonomyUuid = Taxonomy.getUuid(taxonomy)

    const taxonomyUpdated = State.assocTaxonomyProp({ key, value })(taxonomy)
    setState(State.assocTaxonomy(taxonomyUpdated)(state))

    const action = async () => {
      await API.updateTaxonomy({
        surveyId,
        taxonomyUuid,
        data: { key, value },
      })
    }

    dispatch(SurveyActions.metaUpdated())
    dispatch(debounceAction(action, `taxonomy_updated_${taxonomyUuid}`))
  }, [])
}
