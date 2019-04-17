import * as R from 'ramda'
import Record from '../../../../common/record/record'

const record = 'record'

// now context is surveyFormState
export const getRecord = R.prop(record)

//TODO use surveyFormState and remove getRecord from surveyFormState
export const getRecordUuid = R.pipe(
  R.prop('surveyForm'),
  getRecord,
  Record.getUuid
)
