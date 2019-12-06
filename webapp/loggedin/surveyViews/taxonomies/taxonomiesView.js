import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'
import * as TaxonomyState from '../taxonomy/taxonomyState'
import ItemsView from '../items/itemsView'

import { createTaxonomy, deleteTaxonomy } from '../taxonomy/actions'

const TaxonomiesView = props => {
  const { taxonomies, selectedItemUuid, createTaxonomy, deleteTaxonomy, canSelect, onSelect, onClose, readOnly } = props

  const i18n = useI18n()

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
      onSelect={onSelect}
      onClose={onClose}
      readOnly={readOnly}
    />
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey)),
    })),
  )(survey)

  return {
    taxonomies,
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(mapStateToProps, {
  createTaxonomy,
  deleteTaxonomy,
})(TaxonomiesView)
