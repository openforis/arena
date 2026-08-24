import { db } from '@server/db/db'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'

import { getContextUser, fetchFullContextSurvey } from '../../config/context'

import * as RB from '../../../utils/recordBuilder'
import * as SB from '../../../utils/surveyBuilder'
import * as RecordUtils from '../../../utils/recordUtils'

// The real thread posts messages to the parent port, which doesn't exist in the main thread:
// collect them instead, so the record processing logic can be exercised in-process.
class TestRecordsUpdateThread extends RecordsUpdateThread {
  constructor() {
    super({})
    this.messagesPosted = []
  }

  postMessage(msg) {
    this.messagesPosted.push(msg)
  }
}

export const advisoryLockSerializesConcurrentTransactionsTest = async () => {
  const recordUuid = 'test-record-uuid-for-lock'
  const order = []

  const txA = db.tx(async (t) => {
    await t.any('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
    order.push('A-acquired')
    await new Promise((resolve) => setTimeout(resolve, 200))
    order.push('A-releasing')
  })

  // give txA a head start to acquire the lock first
  await new Promise((resolve) => setTimeout(resolve, 50))

  const txB = db.tx(async (t) => {
    await t.any('SELECT pg_advisory_xact_lock(hashtext($1))', [recordUuid])
    order.push('B-acquired')
  })

  await Promise.all([txA, txB])

  expect(order).toEqual(['A-acquired', 'A-releasing', 'B-acquired'])
}

export const fetchRecordDateModifiedReflectsCommittedUpdateTest = async () => {
  const survey = await fetchFullContextSurvey()
  const user = getContextUser()
  const surveyId = Survey.getId(survey)

  const record = await RecordUtils.insertAndInitRecord(user, survey, true)
  const recordUuid = Record.getUuid(record)

  const before = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid })

  await new Promise((resolve) => setTimeout(resolve, 10)) // ensure a distinguishable timestamp
  await RecordManager.updateRecordDateModified({ surveyId, recordUuid })

  const after = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid })

  expect(after.getTime()).toBeGreaterThan(before.getTime())
}

/**
 * Verifies the staleness decision taken by RecordsUpdateThread.getOrFetchRecord:
 * - after a write performed by the thread itself, the cached record must be considered fresh
 *   (the record cached by the write carries the date_modified that write produced, not the
 *   earlier in-memory one stamped before validations/RDB persistence);
 * - when the DB date_modified moves ahead of the cached one (another dyno committed a change),
 *   the record must be refetched and the cache updated.
 * @returns {Promise<void>} - A promise resolved when the test completes.
 */
export const getOrFetchRecordStalenessDecisionTest = async () => {
  const user = getContextUser()

  const survey = await SB.survey(
    user,
    SB.entity('root', SB.attribute('root_key').key(), SB.attribute('num', NodeDef.nodeDefType.integer))
  ).buildAndStore()
  const surveyId = Survey.getId(survey)

  const record = await RB.record(
    user,
    survey,
    RB.entity('root', RB.attribute('root_key', '1'), RB.attribute('num', 1))
  ).buildAndStore()
  const recordUuid = Record.getUuid(record)

  const thread = new TestRecordsUpdateThread()

  const msg = {
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: false,
    user,
    timezoneOffset: 0,
  }

  // perform a real node update through the thread: this is the write path whose in-memory
  // date_modified (stamped before validations/RDB persistence) differs from the one stored in the DB
  const nodeNum = RecordUtils.findNodeByPath('root/num')(survey, record)
  await thread.processRecordNodePersistMsg({ ...msg, node: Node.assocValue(2)(nodeNum) })

  const { recordsCache } = await thread.getOrFetchSurveyData(msg)
  const cachedRecord = recordsCache.get(recordUuid)
  expect(cachedRecord).toBeDefined()

  // the record cached by the write carries the date_modified stored in the DB by that same write
  const dateModifiedDb = await RecordManager.fetchRecordDateModified({ surveyId, recordUuid })
  expect(Record.getDateModified(cachedRecord).getTime()).toBe(dateModifiedDb.getTime())

  // (a) cache considered fresh: the very same cached object is returned, no refetch
  const recordFromCache = await db.tx(async (t) => thread.getOrFetchRecord({ msg, recordUuid, t }))
  expect(recordFromCache).toBe(cachedRecord)

  // (b) DB date_modified moved ahead (as if another dyno committed a change): refetch and update cache
  await new Promise((resolve) => setTimeout(resolve, 10)) // ensure a distinguishable timestamp
  await RecordManager.updateRecordDateModified({ surveyId, recordUuid })

  const recordRefetched = await db.tx(async (t) => thread.getOrFetchRecord({ msg, recordUuid, t }))
  expect(recordRefetched).not.toBe(cachedRecord)
  expect(Record.getUuid(recordRefetched)).toBe(recordUuid)
  expect(recordsCache.get(recordUuid)).toBe(recordRefetched)
}
