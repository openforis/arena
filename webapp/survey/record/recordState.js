import * as R from 'ramda'

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
export const getRecord = R.prop(record)

/**
 * ======
 * UPDATE
 * ======
 */
export const assocNodes = nodes =>
  state => {
    const recordState = getRecord(state)
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
    const recordState = getRecord(state)
    const updRecord = deleteRecordNode(node)(recordState)
    return R.assoc(record, updRecord, state)
  }
