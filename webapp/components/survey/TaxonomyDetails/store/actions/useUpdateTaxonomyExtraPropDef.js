import { useCallback } from 'react'

import * as API from '@webapp/service/api'
import { SurveyActions, useSurveyId } from '@webapp/store/survey'
import { useRefreshTaxonomy } from './useRefreshTaxonomy'
import { useDispatch } from 'react-redux'

export const useUpdateTaxonomyExtraPropDef = ({ setState }) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const refreshTaxonomy = useRefreshTaxonomy({ setState })

  return useCallback(
    async ({ taxonomyUuid, propName, extraPropDef = null, deleted = false }) => {
      const taxonomy = await API.updateTaxonomyExtraPropDef({
        surveyId,
        taxonomyUuid,
        propName,
        extraPropDef,
        deleted,
      })

      await refreshTaxonomy({ taxonomyUuid })

      dispatch(SurveyActions.surveyTaxonomyUpdated(taxonomy))
      dispatch(SurveyActions.metaUpdated())
    },
    [refreshTaxonomy, surveyId]
  )
}
