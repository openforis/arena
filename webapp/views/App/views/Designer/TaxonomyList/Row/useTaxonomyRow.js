import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useLocation, useHistory } from 'react-router'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as TaxonomyActions from '@webapp/loggedin/surveyViews/taxonomy/actions'

const useTaxonomyRow = (props) => {
  const { row: taxonomy, canSelect, onSelectTaxonomy, selectedItemUuid } = props

  const [deleted, setDeleted] = useState(false)

  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()

  const defaultLang = Survey.getDefaultLanguage(surveyInfo)

  const { pathname } = useLocation()
  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))
  const itemLink = inTaxonomiesPath ? appModuleUri(designerModules.taxonomy) : null

  /* delete */
  const canDelete = () =>
    onSelectTaxonomy && taxonomy.usedByNodeDefs
      ? dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' }))
      : true

  const onDelete = () => {
    if (canDelete()) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'taxonomy.confirmDelete',
          params: { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
          onOk: () => {
            dispatch(TaxonomyActions.deleteTaxonomy(taxonomy))
            setDeleted(true)
          },
        })
      )
    }
  }

  /* select */
  const itemUuid = ObjectUtils.getUuid(taxonomy)
  const selected = itemUuid === selectedItemUuid

  /* edit */
  const onEdit = (e) => {
    if (!inTaxonomiesPath) {
      e.preventDefault()
      e.stopPropagation()
      dispatch(TaxonomyActions.setTaxonomyForEdit(Taxonomy.getUuid(taxonomy)))
    } else {
      history.push(`${itemLink}${ObjectUtils.getUuid(taxonomy)}/`)
    }
  }

  const selectTaxonomy = () => onSelectTaxonomy(taxonomy)

  return {
    taxonomy,
    defaultLang,
    selected,
    itemLink,
    canDelete,
    onDelete,
    deleted,
    onEdit,
    canSelect,
    selectTaxonomy,
  }
}

export default useTaxonomyRow
