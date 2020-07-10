import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import * as A from '@core/arena'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { SurveyActions, useSurvey, useSurveyId } from '@webapp/store/survey'

import { State } from '../state'

export const useDelete = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()
  const surveyId = useSurveyId()

  return useCallback(
    ({ state }) => {
      const taxonomy = State.getTaxonomy(state)

      if (!A.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(taxonomy))(survey))) {
        dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' }))
      } else {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'taxonomy.confirmDelete',
            params: { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
            onOk: async () => {
              dispatch(SurveyActions.metaUpdated())
              await axios.delete(`/api/survey/${surveyId}/taxonomies/${Taxonomy.getUuid(taxonomy)}`)
              const initData = State.getInitData(state)
              if (initData) initData()
            },
          })
        )
      }
    },
    [survey]
  )
}
