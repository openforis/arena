import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import * as Taxonomy from '@core/survey/taxonomy'
import * as TaxonomyActions from '@webapp/loggedin/surveyViews/taxonomy/actions'

import { useI18n } from '@webapp/store/system'

import { State } from '../state'

export const useDelete = ({ setState }) => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  return useCallback(({ state }) => {
    const taxonomy = State.getTaxonomy(state)

    if (taxonomy.usedByNodeDefs) {
      dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' }))
    } else {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'taxonomy.confirmDelete',
          params: { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
          onOk: () => {
            dispatch(TaxonomyActions.deleteTaxonomy(taxonomy))
            setState(State.assocDeleted(true)(state))
          },
        })
      )
    }
  }, [])
}
