import { useCallback } from 'react'
import { useHistory } from 'react-router'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { State } from '../state'

export const useDeleteTaxonomyIfEmpty = ({ setState }) => {
  const history = useHistory()
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomyUuid }) => {
    await API.deleteTaxonomyIfEmpty({ surveyId, taxonomyUuid })
    setState(State.assocDeleted)
    history.goBack()
    return true // returns true to notify the navigation to the previous page
  }, [])
}
