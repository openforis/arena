import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useDeleteTaxonomyIfEmpty = ({ setState }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ taxonomyUuid }) => {
    await API.deleteTaxonomyIfEmpty({ surveyId, taxonomyUuid })
    setState(State.assocDeleted)
    dispatch(SurveyActions.surveyTaxonomyDeleted(taxonomyUuid))
    navigate(-1)
    return true // returns true to notify the navigation to the previous page
  }, [])
}
