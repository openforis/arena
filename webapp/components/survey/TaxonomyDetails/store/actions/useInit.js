import { useCallback } from 'react'
import { useParams } from 'react-router'

import axios from 'axios'

import * as A from '@core/arena'

import { useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useInit = ({ setState }) => {
  const { taxonomyUuid: taxonomyUuidParam } = useParams()
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomy }) => {
    let taxonomyToSet = taxonomy

    if (A.isEmpty(taxonomyToSet) && !A.isEmpty(taxonomyUuidParam)) {
      const {
        data: { taxonomy: taxonomyFetched },
      } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuidParam}?draft=true&validate=true`)
      taxonomyToSet = taxonomyFetched
    }

    setState(State.create({ taxonomy: taxonomyToSet }))
  }, [])
}
