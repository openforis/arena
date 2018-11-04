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

import { fetchTaxonomies } from '../../../survey/taxonomies/actions'
import {
  createTaxonomy,
  setTaxonomyForEdit,
  deleteTaxonomy,
} from '../taxonomyEdit/actions'

class Taxonomies extends React.Component {

  componentDidMount () {
    const {fetchOnMount, fetchTaxonomies} = this.props
    //for now only from designer, draft = true
    if (fetchOnMount)
      fetchTaxonomies(true)
  }

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

Taxonomies.defaultProps = {
  fetchOnMount: true,
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  const taxonomies = R.pipe(
    getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: getNodeDefsByTaxonomyUUID(t.uuid)(survey).length > 0
    }))
  )(survey)

  return {
    taxonomies,
    taxonomy: getTaxonomyEditTaxonomy(survey),
  }
}

export default connect(
  mapStateToProps,
  {fetchTaxonomies, createTaxonomy, setTaxonomyForEdit, deleteTaxonomy}
)(Taxonomies)