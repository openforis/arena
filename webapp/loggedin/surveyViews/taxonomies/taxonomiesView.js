import React from 'react'
import { connect, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'
import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { setNodeDefProp } from '@webapp/survey/nodeDefs/actions'
import { createTaxonomy, deleteTaxonomy } from '@webapp/loggedin/surveyViews/taxonomy/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'

import ItemsView from '../items/itemsView'

const TaxonomiesView = props => {
  const { taxonomies, selectedItemUuid, canSelect, readOnly, createTaxonomy } = props

  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const onClose = selectedItemUuid ? history.goBack : null

  const canDelete = taxonomy => (taxonomy.usedByNodeDefs ? dispatch(showNotification('taxonomy.cantBeDeleted')) : true)

  const onDelete = taxonomy =>
    dispatch(
      showDialogConfirm(
        'taxonomy.confirmDelete',
        { taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName') },
        () => dispatch(deleteTaxonomy(taxonomy)),
      ),
    )

  return (
    <ItemsView
      itemLabelFunction={taxonomy => Taxonomy.getName(taxonomy)}
      itemLink={appModuleUri(designerModules.taxonomy)}
      items={taxonomies}
      selectedItemUuid={selectedItemUuid}
      onAdd={createTaxonomy}
      canDelete={canDelete}
      onDelete={onDelete}
      canSelect={canSelect}
      onSelect={taxonomy => dispatch(setNodeDefProp(NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy)))}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)
  const readOnly = !Authorizer.canEditSurvey(user, surveyInfo)
  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey)),
    })),
  )(survey)
  // A nodeDef taxon is begin edited.
  const nodeDef = !readOnly && NodeDefState.getNodeDef(state)
  const canSelect = nodeDef && NodeDef.isTaxon(nodeDef)
  const selectedItemUuid = canSelect && NodeDef.getTaxonomyUuid(nodeDef)

  return {
    taxonomies,
    readOnly,
    selectedItemUuid,
    canSelect,
  }
}

export default connect(mapStateToProps, { createTaxonomy })(TaxonomiesView)
