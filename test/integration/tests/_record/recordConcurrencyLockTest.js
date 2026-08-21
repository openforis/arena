import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser, fetchFullContextSurvey } from '../../config/context'

import * as RecordUtils from '../../../utils/recordUtils'

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
