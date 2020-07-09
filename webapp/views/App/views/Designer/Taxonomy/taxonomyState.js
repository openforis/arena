import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { SurveyState } from '@webapp/store/survey'
import * as SurveyViewsState from '@webapp/loggedin/surveyViews/surveyViewsState'

export const keys = {
  taxa: 'taxa',
  taxonomyUuid: 'taxonomyUuid',
}

export const stateKey = 'taxonomy'
const getState = R.pipe(SurveyViewsState.getState, R.prop(stateKey))
const getStateProp = (prop, defaultValue = null) => R.pipe(getState, R.propOr(defaultValue, prop))

// ==== taxonomy for edit

export const initTaxonomyEdit = (taxonomyUuid) => (taxonomyUuid ? { taxonomyUuid } : null)

export const getTaxonomy = (state) => {
  const survey = SurveyState.getSurvey(state)
  const taxonomyUuid = getStateProp(keys.taxonomyUuid)(state)
  return Survey.getTaxonomyByUuid(taxonomyUuid)(survey)
}

// ==== taxonomyEdit Props

export const mergeTaxonomyEditProps = (props) => R.mergeDeepLeft(props)
