import * as RecordConcurrencyLockTest from './_record/recordConcurrencyLockTest'

describe('Record Concurrency Lock Test', () => {
  test(
    'Advisory lock serializes concurrent transactions',
    RecordConcurrencyLockTest.advisoryLockSerializesConcurrentTransactionsTest
  )
  test(
    'fetchRecordDateModified reflects committed update',
    RecordConcurrencyLockTest.fetchRecordDateModifiedReflectsCommittedUpdateTest
  )
  test(
    'getOrFetchRecord uses the cache after its own write and refetches when the DB moves ahead',
    RecordConcurrencyLockTest.getOrFetchRecordStalenessDecisionTest
  )
})
