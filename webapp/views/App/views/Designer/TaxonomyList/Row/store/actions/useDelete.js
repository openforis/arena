import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import * as A from '@core/arena'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Survey from '@core/survey/survey'
import * as TaxonomyActions from '@webapp/loggedin/surveyViews/taxonomy/actions'

import { useI18n } from '@webapp/store/system'
import { useSurvey } from '@webapp/store/survey'

import { State } from '../state'

export const useDelete = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const survey = useSurvey()

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
            onOk: () => {
              dispatch(TaxonomyActions.deleteTaxonomy(taxonomy, State.getRefetch(state)))
            },
          })
        )
      }
    },
    [survey]
  )
}
