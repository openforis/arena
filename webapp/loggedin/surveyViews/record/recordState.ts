import * as R from 'ramda'

import Record from '../../../../core/record/record'

import * as SurveyViewsState from '../surveyViewsState'

export const stateKey = 'record'
export const getRecord: (x: any) => any = R.pipe(SurveyViewsState.getState, R.prop(stateKey))

export const getRecordUuid: (x: any) => string = R.pipe(
  getRecord,
  Record.getUuid
)
