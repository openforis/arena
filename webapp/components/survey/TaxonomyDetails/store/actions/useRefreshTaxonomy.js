import { useCallback } from 'react'

import * as A from '@core/arena'

import * as API from '@webapp/service/api'

import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useRefreshTaxonomy = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomyUuid }) => {
    const taxonomy = await API.fetchTaxonomy({ surveyId, taxonomyUuid })
    setState((statePrev) => {
      const taxaVersionPrev = State.getTaxaVersion(statePrev)
      return A.pipe(State.assocTaxonomy(taxonomy), State.assocTaxaVersion(taxaVersionPrev + 1))(statePrev)
    })
  }, [])
}
