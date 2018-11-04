import * as R from 'ramda'

import Survey from '../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    // loaded taxonomy
    taxonomyEdit: {
      taxonomyUUID: '',
      taxa: [],
      currentPage: 0,
      totalPages: 0,
      taxaPerPage: 15,
    },

  }
}

const taxonomyEdit = 'taxonomyEdit'
const taxonomyUUID = 'taxonomyUUID'

// ==== taxonomy for edit
export const initTaxonomyEdit = uuid => uuid ? {taxonomyUUID: uuid} : null

export const getTaxonomyEditTaxonomy = survey => R.pipe(
  R.path([taxonomyEdit, taxonomyUUID]),
  uuid => Survey.getSurveyTaxonomyByUUID(uuid)(survey),
)(survey)

// ==== taxonomyEdit Props
export const mergeTaxonomyEditProps = props => R.mergeDeepLeft(props)

export const getTaxonomyEditTaxaCurrentPage = R.pathOr(1, [taxonomyEdit, 'taxaCurrentPage'])

export const getTaxonomyEditTaxaPerPage = R.pathOr(15, [taxonomyEdit, 'taxaPerPage'])

export const getTaxonomyEditTaxaTotalPages = R.pathOr(0, [taxonomyEdit, 'taxaTotalPages'])

export const getTaxonomyEditTaxa = R.pathOr([], [taxonomyEdit, 'taxa'])

