import * as R from 'ramda'

import Record from '../../../../common/record/record'

import * as  SurveyViewsState from '../surveyViewsState'

export const getRecord = R.pipe(SurveyViewsState.getState, R.prop('record'))

export const getRecordUuid = R.pipe(
  getRecord,
  Record.getUuid
)
