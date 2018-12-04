import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    // loaded taxonomy
    taxonomyEdit: {
      taxonomyUuid: '',
      taxa: [],
      currentPage: 0,
      totalPages: 0,
      taxaPerPage: 15,
    },

  }
}

const taxonomyEdit = 'taxonomyEdit'
const taxonomyUuid = 'taxonomyUuid'

// ==== taxonomy for edit
export const initTaxonomyEdit = uuid => uuid ? {[taxonomyUuid]: uuid} : null

export const getTaxonomyEditTaxonomy = survey =>
  surveyForm => R.pipe(
    R.path([taxonomyEdit, taxonomyUuid]),
    uuid => Survey.getTaxonomyByUuid(uuid)(survey),
  )(surveyForm)

// ==== taxonomyEdit Props
export const mergeTaxonomyEditProps = props => R.mergeDeepLeft(props)

export const getTaxonomyEditTaxaCurrentPage = R.pathOr(1, [taxonomyEdit, 'taxaCurrentPage'])

export const getTaxonomyEditTaxaPerPage = R.pathOr(15, [taxonomyEdit, 'taxaPerPage'])

export const getTaxonomyEditTaxaTotalPages = R.pathOr(0, [taxonomyEdit, 'taxaTotalPages'])

export const getTaxonomyEditTaxa = R.pathOr([], [taxonomyEdit, 'taxa'])

