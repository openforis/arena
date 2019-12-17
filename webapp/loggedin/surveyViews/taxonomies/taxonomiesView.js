import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'
import { useHistory } from 'react-router'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as NodeDefEditState from '@webapp/loggedin/surveyViews/nodeDefEdit/nodeDefEditState'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'

import { setNodeDefProp } from '@webapp/survey/nodeDefs/actions'
import { createTaxonomy, deleteTaxonomy } from '../taxonomy/actions'
import ItemsView from '../items/itemsView'

const TaxonomiesView = props => {
  const { taxonomies, nodeDef, createTaxonomy, deleteTaxonomy, canSelect, readOnly, setNodeDefProp } = props

  const selectedItemUuid = nodeDef && NodeDef.getTaxonomyUuid(nodeDef)

  const i18n = useI18n()
  const history = useHistory()

  const onClose = nodeDef ? history.goBack : null

  const canDelete = taxonomy =>
    taxonomy.usedByNodeDefs
      ? alert(i18n.t('taxonomy.cantBeDeleted'))
      : window.confirm(
          i18n.t('taxonomy.confirmDelete', {
            taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName'),
          }),
        )

  return (
    <ItemsView
      itemLabelFunction={taxonomy => Taxonomy.getName(taxonomy)}
      itemLink={appModuleUri(designerModules.taxonomy)}
      items={taxonomies}
      selectedItemUuid={selectedItemUuid}
      onAdd={createTaxonomy}
      canDelete={canDelete}
      onDelete={deleteTaxonomy}
      canSelect={canSelect}
      onSelect={taxonomy => setNodeDefProp(NodeDef.propKeys.taxonomyUuid, Taxonomy.getUuid(taxonomy))}
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
  const nodeDef = !readOnly && NodeDefEditState.getNodeDef(state)
  const canSelect = nodeDef && NodeDef.isTaxon(nodeDef)

  return {
    taxonomies,
    readOnly,
    nodeDef,
    canSelect,
  }
}

export default connect(mapStateToProps, {
  createTaxonomy,
  deleteTaxonomy,
  setNodeDefProp,
})(TaxonomiesView)
