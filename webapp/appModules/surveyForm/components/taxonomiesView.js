import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import ItemsView from './items/itemsView'
import TaxonomyEdit from '../taxonomyEdit/components/taxonomyEdit'

import Survey from '../../../../common/survey/survey'
import Taxonomy from '../../../../common/survey/taxonomy'
import { canEditSurvey } from '../../../../common/auth/authManager'

import { getStateSurveyInfo, getSurvey } from '../../../survey/surveyState'
import { getTaxonomyEditTaxonomy } from '../taxonomyEdit/taxonomyEditState'
import { getUser } from '../../../app/appState'

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
      : window.confirm(`Delete the taxonomy ${Taxonomy.getTaxonomyName(taxonomy)}? This operation cannot be undone.`)

    return <ItemsView headerText="Taxonomies"
                      itemEditComponent={TaxonomyEdit}
                      itemEditProp="taxonomy"
                      itemLabelFunction={taxonomy => Taxonomy.getTaxonomyName(taxonomy)}
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
  }
}

const mapStateToProps = state => {
  const survey = getSurvey(state)
  const surveyForm = getSurveyForm(state)
  const user = getUser(state)
  const surveyInfo = getStateSurveyInfo(state)

  const taxonomies = R.pipe(
    Survey.getTaxonomiesArray,
    R.map(t => ({
      ...t,
      usedByNodeDefs: Survey.getNodeDefsByTaxonomyUuid(t.uuid)(survey).length > 0
    }))
  )(survey)

  return {
    taxonomies,
    taxonomy: getTaxonomyEditTaxonomy(survey)(surveyForm),
    readOnly: !canEditSurvey(user, surveyInfo),
  }
}

export default connect(
  mapStateToProps,
  {createTaxonomy, setTaxonomyForEdit, deleteTaxonomy}
)(TaxonomiesView)