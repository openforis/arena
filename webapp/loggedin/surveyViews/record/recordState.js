import * as R from 'ramda'

import * as Record from '@core/record/record'

import * as SurveyViewsState from '../surveyViewsState'

export const stateKey = 'record'
export const getRecord = R.pipe(SurveyViewsState.getState, R.prop(stateKey))

export const getRecordUuid = R.pipe(
  getRecord,
  Record.getUuid
)
