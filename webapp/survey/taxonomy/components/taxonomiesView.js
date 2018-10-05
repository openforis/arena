import './taxonomies.scss'

import React from 'react'
import { connect } from 'react-redux'

import ItemsView from '../../../commonComponents/itemsView'
import TaxonomyEdit from './taxonomyEdit'

import { getNodeDefsByTaxonomyUUID, getSurveyTaxonomiesArray } from '../../../../common/survey/survey'
import { getTaxonomyName } from '../../../../common/survey/taxonomy'

import { getSurvey } from '../../surveyState'
import { getTaxonomyEditImportingFile, getTaxonomyEditTaxonomy } from '../taxonomyEditState'

import {
  createTaxonomy,
  setTaxonomyForEdit,
  putTaxonomyProp,
  deleteTaxonomy,
  uploadTaxonomyFile,
} from '../actions'

const TaxonomiesView = (props) => {
  const {survey, taxonomy, createTaxonomy, setTaxonomyForEdit, deleteTaxonomy} = props

  const canDeleteTaxonomy = taxonomy => {
    if (getNodeDefsByTaxonomyUUID(taxonomy.uuid)(survey).length > 0) {
      alert('This taxonomy is used by some node definitions and cannot be removed')
    } else {
      return window.confirm(`Delete the taxonomy ${getTaxonomyName(taxonomy)}? This operation cannot be undone.`)
    }
  }

  const taxonomies = getSurveyTaxonomiesArray(survey)

  return <ItemsView {...props}
                    headerText="Taxonomies"
                    itemEditComponent={TaxonomyEdit}
                    itemEditProp="taxonomy"
                    itemLabelFunction={taxonomy => getTaxonomyName(taxonomy)}
                    editedItem={taxonomy}
                    items={taxonomies}
                    onAdd={createTaxonomy}
                    onEdit={setTaxonomyForEdit}
                    canDelete={canDeleteTaxonomy}
                    onDelete={deleteTaxonomy}/>
}

const mapStateToProps = state => {
  const survey = getSurvey(state)

  return {
    survey,
    taxonomy: getTaxonomyEditTaxonomy(survey),
    importingTaxonomy: getTaxonomyEditImportingFile(survey),
  }
}

export default connect(
  mapStateToProps,
  {createTaxonomy, setTaxonomyForEdit, putTaxonomyProp, deleteTaxonomy, uploadTaxonomyFile}
)(TaxonomiesView)