import { useCallback } from 'react'
import axios from 'axios'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { SurveyActions, useSurvey, useSurveyId } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import { State } from '../state'

export const useDelete = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  return useCallback(
    ({ state }) => {
      const taxonomy = State.getTaxonomy(state)
      const taxonomyUuid = Taxonomy.getUuid(taxonomy)

      if (!A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(taxonomyUuid)(survey))) {
        dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' }))
      } else {
        const taxonomyName = Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName')
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'taxonomy.confirmDelete',
            params: { taxonomyName },
            onOk: async () => {
              await axios.delete(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}`)
              const initData = State.getInitData(state)
              if (initData) initData()

              dispatch(SurveyActions.surveyTaxonomyDeleted(taxonomyUuid))
              dispatch(SurveyActions.metaUpdated())
            },
          })
        )
      }
    },
    [survey]
  )
}
