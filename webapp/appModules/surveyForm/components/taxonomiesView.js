import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from './items/itemsView'
import TaxonomyEdit from '../taxonomyEdit/components/taxonomyEdit'

import {
  getNodeDefsByTaxonomyUUID,
  getTaxonomiesArray
} from '../../../../common/survey/survey'
import { getTaxonomyName } from '../../../../common/survey/taxonomy'

import { getSurvey } from '../../../survey/surveyState'
import { getTaxonomyEditTaxonomy } from '../taxonomyEdit/taxonomyEditState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
  deleteTaxonomy,
} from '../taxonomyEdit/actions'
import { getSurveyForm } from '../surveyFormState'

class TaxonomiesView extends React.Component {

  render () {
    const {taxonomy, taxonomies, selectedTaxonomyUUID, createTaxonomy, setTaxonomyForEdit, deleteTaxonomy} = this.props

    const canDeleteTaxonomy = taxonomy => taxonomy.usedByNodeDefs
      ? alert('This taxonomy is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the taxonomy ${getTaxonomyName(taxonomy)}? This operation cannot be undone.`)

    return <ItemsView {...this.props}
                      headerText="Taxonomies"
                      itemEditComponent={TaxonomyEdit}
                      itemEditProp="taxonomy"
                      itemLabelFunction={taxonomy => getTaxonomyName(taxonomy)}
                      editedItem={taxonomy}
                      items={taxonomies}
                      tableSelectedItemUUID={selectedTaxonomyUUID}
                      onAdd={createTaxonomy}
                      onEdit={setTaxonomyForEdit}
                      canDelete={canDeleteTaxonomy}
                      onDelete={deleteTaxonomy}/>
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)

  const taxonomies = R.pipe(
    getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: getNodeDefsByTaxonomyUUID(t.uuid)(survey).length > 0
    }))
  )(survey)

  return {
    taxonomies,
    taxonomy: getTaxonomyEditTaxonomy(survey)(surveyForm),
  }
}

export default connect(
  mapStateToProps,
  {createTaxonomy, setTaxonomyForEdit, deleteTaxonomy}
)(TaxonomiesView)