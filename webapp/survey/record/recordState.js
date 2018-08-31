import * as R from 'ramda'
import { getSurvey } from '../surveyState'
import {
  assocNodes as assocRecordNodes,
  deleteNode as deleteRecordNode,
} from '../../../common/record/record'

/**
 * ======================
 * Record
 * ======================
 */
const record = 'record'

/**
 * ======
 * READ
 * ======
 */
export const getRecord = R.pipe(
  getSurvey,
  R.prop(record),
)

/**
 * ======
 * UPDATE
 * ======
 */
export const assocNodes = nodes =>
  state => {
    const recordState = R.prop(record, state)
    const updRecord = assocRecordNodes(nodes)(recordState)
    return R.assoc(record, updRecord, state)
  }

/**
 * ======
 * DELETE
 * ======
 */
export const deleteNode = node =>
  state => {
    const recordState = R.prop(record, state)
    const updRecord = deleteRecordNode(node)(recordState)
    return R.assoc(record, updRecord, state)
  }
