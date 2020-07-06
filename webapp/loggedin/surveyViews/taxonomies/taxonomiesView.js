import './taxonomiesView.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { matchPath, useHistory, useLocation } from 'react-router'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'

import PanelRight from '@webapp/components/PanelRight'
import ItemsView from '@webapp/loggedin/surveyViews/items/itemsView'
import TaxonomyView from '@webapp/loggedin/surveyViews/taxonomy/taxonomyView'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
import { useSurvey } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import * as TaxonomyActions from '@webapp/loggedin/surveyViews/taxonomy/actions'
import * as TaxonomyState from '@webapp/loggedin/surveyViews/taxonomy/taxonomyState'

import ColumnDescription from './ColumnDescription'

const TaxonomiesView = (props) => {
  const { canSelect, onSelect, selectedItemUuid, onClose } = props

  const i18n = useI18n()
  const history = useHistory()
  const { pathname } = useLocation()
  const dispatch = useDispatch()

  const inTaxonomiesPath = Boolean(matchPath(pathname, appModuleUri(designerModules.taxonomies)))

  const survey = useSurvey()
  const readOnly = !useAuthCanEditSurvey()
  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map((t) => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey)),
    }))
  )(survey)

  const editedTaxonomy = useSelector(TaxonomyState.getTaxonomy)

  const canDelete = (taxonomy) =>
    taxonomy.usedByNodeDefs ? dispatch(NotificationActions.notifyInfo({ key: 'taxonomy.cantBeDeleted' })) : true

  const onAdd = async () => {
    const taxonomy = await dispatch(TaxonomyActions.createTaxonomy())
    if (onSelect) {
      onSelect(taxonomy)
    }
    if (inTaxonomiesPath) {
      history.push(`${appModuleUri(designerModules.taxonomy)}${Taxonomy.getUuid(taxonomy)}/`)
    }
  }

  const onDelete = (taxonomy) =>
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'taxonomy.confirmDelete',
        params: { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
        onOk: () => dispatch(TaxonomyActions.deleteTaxonomy(taxonomy)),
      })
    )

  return (
    <>
      <ItemsView
        itemLabelFunction={Taxonomy.getName}
        itemLink={inTaxonomiesPath ? appModuleUri(designerModules.taxonomy) : null}
        items={taxonomies}
        selectedItemUuid={selectedItemUuid}
        onAdd={onAdd}
        onEdit={(taxonomy) =>
          !inTaxonomiesPath && dispatch(TaxonomyActions.setTaxonomyForEdit(Taxonomy.getUuid(taxonomy)))
        }
        canDelete={canDelete}
        onDelete={onDelete}
        canSelect={canSelect}
        onSelect={onSelect}
        onClose={onClose}
        readOnly={readOnly}
        columns={[...ItemsView.defaultProps.columns, ColumnDescription]}
        className="taxonomies"
      />
      {editedTaxonomy && (
        <PanelRight
          width="100vw"
          header={i18n.t('taxonomy.header')}
          onClose={() => dispatch(TaxonomyActions.setTaxonomyForEdit(null))}
        >
          <TaxonomyView showClose={false} />
        </PanelRight>
      )}
    </>
  )
}

TaxonomiesView.propTypes = {
  canSelect: PropTypes.bool,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
  selectedItemUuid: PropTypes.string,
}

TaxonomiesView.defaultProps = {
  canSelect: false,
  onClose: null,
  onSelect: null,
  selectedItemUuid: null,
}

export default TaxonomiesView
