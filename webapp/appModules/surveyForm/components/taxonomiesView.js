import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from './items/itemsView'
import TaxonomyEdit from '../taxonomyEdit/components/taxonomyEdit'

import Survey from '../../../../common/survey/survey'
import Taxonomy from '../../../../common/survey/taxonomy'

import { getSurvey } from '../../../survey/surveyState'
import { getTaxonomyEditTaxonomy } from '../taxonomyEdit/taxonomyEditState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
  deleteTaxonomy,
} from '../taxonomyEdit/actions'
import { getSurveyForm } from '../surveyFormState'

class TaxonomiesView extends React.Component {

  componentWillUnmount () {
    const {taxonomy, setTaxonomyForEdit} = this.props
    if (taxonomy)
      setTaxonomyForEdit(null)
  }

  render () {
    const {
      taxonomy,
      taxonomies,
      selectedItemUUID,
      createTaxonomy,
      setTaxonomyForEdit,
      deleteTaxonomy,
      canSelect,
      onSelect,
      onClose,
    } = this.props

    const canDelete = taxonomy => taxonomy.usedByNodeDefs
      ? alert('This taxonomy is used by some node definitions and cannot be removed')
      : window.confirm(`Delete the taxonomy ${Taxonomy.getTaxonomyName(taxonomy)}? This operation cannot be undone.`)

    return <ItemsView headerText="Taxonomies"
                      itemEditComponent={TaxonomyEdit}
                      itemEditProp="taxonomy"
                      itemLabelFunction={taxonomy => Taxonomy.getTaxonomyName(taxonomy)}
                      editedItem={taxonomy}
                      items={taxonomies}
                      selectedItemUUID={selectedItemUUID}
                      onAdd={createTaxonomy}
                      onEdit={setTaxonomyForEdit}
                      canDelete={canDelete}
                      onDelete={deleteTaxonomy}
                      canSelect={canSelect}
                      onSelect={onSelect}
                      onClose={onClose}/>
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)

  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: Survey.getNodeDefsByTaxonomyUUID(t.uuid)(survey).length > 0
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