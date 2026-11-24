import { getContextUser } from '../config/context'

import * as RecordCheckJobMissingNodesTest from './_record/recordCheckJobMissingNodesTest'

describe('RecordCheckJob - missing nodes', () => {
  test('Inserts missing nodes with default values applied, scoped to given record uuids', () =>
    RecordCheckJobMissingNodesTest.recordCheckJobInsertsMissingNodesWithDefaultValuesTest({ user: getContextUser() }))

  test('An empty record uuids array is a no-op, not "check every record"', () =>
    RecordCheckJobMissingNodesTest.recordCheckJobWithEmptyRecordUuidsIsNoOpTest({ user: getContextUser() }))
})
