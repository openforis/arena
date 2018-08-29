import * as R from 'ramda'
import { assocNodes as assocRecordNodes } from '../../../common/record/record'
import { getSurveyState } from '../surveyState'

/**
 * ======================
 * Record
 * ======================
 */
const record = 'record'

export const getRecord = R.pipe(
  getSurveyState,
  R.prop(record),
)

export const assocNodes = nodes =>
  state => {
    const recordState = R.prop(record, state)
    const updRecord = assocRecordNodes(nodes)(recordState)
    return R.assoc(record, updRecord, state)
  }
