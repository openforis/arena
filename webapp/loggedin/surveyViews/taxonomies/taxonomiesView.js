import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from '../items/itemsView'
import TaxonomyEdit from '../taxonomyEdit/components/taxonomyEdit'

import Survey from '../../../../common/survey/survey'
import Taxonomy from '../../../../common/survey/taxonomy'
import { canEditSurvey } from '../../../../common/auth/authManager'

import * as SurveyState from '../../../survey/surveyState'
import * as TaxonomyEditState from '../taxonomyEdit/taxonomyEditState'
import * as AppState from '../../../app/appState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
  deleteTaxonomy,
} from '../taxonomyEdit/actions'

class TaxonomiesView extends React.Component {

  componentWillUnmount () {
    const { taxonomy, setTaxonomyForEdit } = this.props
    if (taxonomy)
      setTaxonomyForEdit(null)
  }

  render () {
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
    } = this.props

    const canDelete = taxonomy => taxonomy.usedByNodeDefs
      ? alert('This taxonomy is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the taxonomy ${Taxonomy.getName(taxonomy)}? This operation cannot be undone.`)

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
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: !R.isEmpty(Survey.getNodeDefsByTaxonomyUuid(Taxonomy.getUuid(t))(survey))
    }))
  )(survey)

  return {
    taxonomies,
    taxonomy: TaxonomyEditState.getTaxonomy(state),
    readOnly: !canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  { createTaxonomy, setTaxonomyForEdit, deleteTaxonomy }
)(TaxonomiesView)