import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useInit = ({ setState }) => {
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomyUuid }) => {
    const taxonomy = await API.fetchTaxonomy({ surveyId, taxonomyUuid })
    setState(State.create({ taxonomy }))
  }, [])
}
