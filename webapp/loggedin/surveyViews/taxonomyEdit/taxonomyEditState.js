import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'

import * as SurveyViewsState from '../surveyViewsState'
import * as SurveyState from '../../../survey/surveyState'

// DOCS
const stateDoc = {
  taxonomyEdit: {
    taxonomyUuid: '',
    taxa: [],
    taxaCurrentPage: 0,
    taxaTotalPages: 0,
    taxaPerPage: 15,
  },
}

const keys = {
  taxonomyUuid: 'taxonomyUuid',
  taxa: 'taxa',
  taxaCurrentPage: 'taxaCurrentPage',
  taxaTotalPages: 'taxaTotalPages',
  taxaTotal: 'taxaTotal',
  taxaPerPage: 'taxaPerPage',
}

export const stateKey = 'taxonomyEdit'
const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

// ==== taxonomy for edit

export const initTaxonomyEdit = taxonomyUuid => taxonomyUuid ? { taxonomyUuid } : null

export const getTaxonomy = state => {
  const survey = SurveyState.getSurvey(state)
  const taxonomyUuid = getStateProp(keys.taxonomyUuid)(state)
  return Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
}

// ==== taxonomyEdit Props

export const mergeTaxonomyEditProps = props => R.mergeDeepLeft(props)

export const getTaxaCurrentPage = getStateProp(keys.taxaCurrentPage, 0)

export const getTaxaPerPage = getStateProp(keys.taxaPerPage, 15)

export const getTaxaTotalPages = getStateProp(keys.taxaTotalPages, 0)

export const getTaxaTotal = getStateProp(keys.taxaTotal, 0)

export const getTaxa = getStateProp(keys.taxa, [])