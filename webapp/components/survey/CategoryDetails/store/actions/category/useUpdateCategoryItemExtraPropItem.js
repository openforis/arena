import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'

import { State } from '../../state'

export const useUpdateCategoryItemExtraPropItem = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()

  return useCallback(async ({ categoryUuid, name, itemExtraDef = null, deleted = false }) => {
    const category = await API.updateCategoryItemExtraDefItem({ surveyId, categoryUuid, name, itemExtraDef, deleted })

    dispatch(SurveyActions.metaUpdated())

    setState(State.assocCategory({ category }))
  }, [])
}
