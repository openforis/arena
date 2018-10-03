import './codeLists.scss'

import React from 'react'
import { connect } from 'react-redux'

import ItemsView from '../../../commonComponents/itemsView'
import TaxonomyEdit from './taxonomyEdit'

import { getSurvey } from '../../surveyState'
import { getTaxonEditTaxonomy } from '../taxonomyEditState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
} from '../actions'

const TaxonomyListView = (props) => {
  const {taxonomy, createTaxonomy, onClose} = props

  return <ItemsView {...props}
                    headerText="Taxonomies"
                    itemEditComponent={TaxonomyEdit}
                    itemEditProp="taxonomy"
                    item={taxonomy}
                    onEdit={setTaxonomyForEdit}
                    onAdd={createTaxonomy}
                    onClose={onClose}/>
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    taxonomy: getTaxonEditTaxonomy(survey),
  }
}

export default connect(
  mapStateToProps,
  {createTaxonomy, setTaxonomyForEdit}
)(TaxonomyListView)