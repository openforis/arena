import * as R from 'ramda'

import Survey from '../../../../core/survey/survey'

import * as SurveyViewsState from '../surveyViewsState'
import * as SurveyState from '../../../survey/surveyState'

export const keys = {
  taxa: 'taxa',
  taxonomyUuid: 'taxonomyUuid',
}

export const stateKey = 'taxonomyEdit'
const getState: (x: any) => any = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp: (prop: any, defaultValue?: any) => (x: any) => any
= (prop, defaultValue = null) =>
  R.pipe(getState, R.propOr(defaultValue, prop))

// ==== taxonomy for edit

export const initTaxonomyEdit = taxonomyUuid => taxonomyUuid ? { taxonomyUuid } : null

export const getTaxonomy = state => {
  const survey = SurveyState.getSurvey(state)
  const taxonomyUuid = getStateProp(keys.taxonomyUuid)(state)
  return Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
}

// ==== taxonomyEdit Props

export const mergeTaxonomyEditProps = props => R.mergeDeepLeft(props)
