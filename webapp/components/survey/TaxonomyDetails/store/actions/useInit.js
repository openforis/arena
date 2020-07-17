import { useCallback } from 'react'
import { useParams } from 'react-router'

import * as A from '@core/arena'

import * as API from '@webapp/service/api'

import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useInit = ({ setState }) => {
  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomyUuid }) => {
    if (!A.isEmpty(taxonomyUuid) || !A.isEmpty(taxonomyUuidParam)) {
      const taxonomy = await API.fetchTaxonomy({ surveyId, Uuid: taxonomyUuidParam || taxonomyUuid })
      setState(State.create({ taxonomy }))
    }
  }, [])
}
