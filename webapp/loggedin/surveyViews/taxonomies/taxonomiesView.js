import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/commonComponents/hooks'

import ItemsView from '../items/itemsView'
import TaxonomyEdit from '../taxonomyEdit/taxonomyEditView'

import * as Survey from '@core/survey/survey'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Authorizer from '@core/auth/authorizer'

import * as SurveyState from '@webapp/survey/surveyState'
import * as TaxonomyEditState from '../taxonomyEdit/taxonomyEditState'
import * as AppState from '@webapp/app/appState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
  deleteTaxonomy,
} from '../taxonomyEdit/actions'


const TaxonomiesView = (props) => {

  const {
    taxonomy,
    taxonomies,
    selectedItemUuid,
    createTaxonomy,
    setTaxonomyForEdit,
    deleteTaxonomy,
    canSelect,
    onSelect,
    onClose,
    readOnly,
  } = props

  useEffect(() =>
    () => {
      if (taxonomy) {
        setTaxonomyForEdit(null)
      }
    }, [Taxonomy.getUuid(taxonomy)]
  )

  const i18n = useI18n()

  const canDelete = taxonomy => taxonomy.usedByNodeDefs
    ? alert(i18n.t('taxonomy.cantBeDeleted'))
    : window.confirm(i18n.t('taxonomy.confirmDelete', {
      taxonomyName: Taxonomy.getName(taxonomy) || i18n.t('common.undefinedName'),
    }))

  return (
    <ItemsView
      headerText="Taxonomies"
      itemEditComponent={TaxonomyEdit}
      itemEditProp="taxonomy"
      itemLabelFunction={taxonomy => Taxonomy.getName(taxonomy)}
      editedItem={taxonomy}
      items={taxonomies}
      selectedItemUuid={selectedItemUuid}
      onAdd={createTaxonomy}
      onEdit={setTaxonomyForEdit}
      canDelete={canDelete}
      onDelete={deleteTaxonomy}
      canSelect={canSelect}
      onSelect={onSelect}
      onClose={onClose}
      readOnly={readOnly}/>
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
    }))
  )(survey)

  return {
    taxonomies,
    taxonomy: TaxonomyEditState.getTaxonomy(state),
    readOnly: !Authorizer.canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { createTaxonomy, setTaxonomyForEdit, deleteTaxonomy }
)(TaxonomiesView)