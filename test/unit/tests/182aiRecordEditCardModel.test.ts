import {
  countOperationResults,
  getRecordEditLink,
  getRetryOperationIds,
  getSelectableOperationIds,
  groupOperationsByRecord,
  mergeOperationResults,
  summarizeRecordEditResults,
} from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'

const operation = (recordUuid: string, nodeUuid: string, recordNewErrors = 0) => ({
  id: `${recordUuid}/${nodeUuid}`,
  type: 'record.attributeUpdate' as const,
  recordUuid,
  nodeUuid,
  nodeDefUuid: 'def',
  recordKeys: `keys of ${recordUuid}`,
  path: `path ${nodeUuid}`,
  from: 1,
  to: 2,
  preview: { badge: 'fixes' as const, messages: [], recordNewErrors },
  page: { nodeUuid: `page-${recordUuid}`, nodeDefUuid: 'page-def' },
  display: { from: '1', to: '2' },
})

const operations = [operation('a', '1', 2), operation('b', '1'), operation('a', '2', 2)]

describe('record edit card model', () => {
  test('groups the edits by record, in order of first appearance, with the record link', () => {
    const groups = groupOperationsByRecord(operations)
    expect(
      groups.map((group) => [group.recordUuid, group.recordKeys, group.recordNewErrors, group.operations.length])
    ).toEqual([
      ['a', 'keys of a', 2, 2],
      ['b', 'keys of b', 0, 1],
    ])
    expect(groups[0].link).toBe(getRecordEditLink(operations[0]))
  })

  test('the link opens the record at the page of the node', () => {
    expect(getRecordEditLink(operations[0])).toMatch(/record\/a\?pageNodeUuid=page-a&pageNodeDefUuid=page-def$/)
  })

  test('applied and conflicting edits can no longer be selected; failed ones can', () => {
    const results = [
      { id: 'a/1', status: 'applied' as const },
      { id: 'b/1', status: 'conflict' as const },
      { id: 'a/2', status: 'failed' as const, message: 'appErrors:record.lockTimeout' },
    ]
    expect(getSelectableOperationIds(operations, [])).toEqual(['a/1', 'b/1', 'a/2'])
    expect(getSelectableOperationIds(operations, results)).toEqual(['a/2'])
    expect(getRetryOperationIds(results)).toEqual(['a/2'])
    expect(countOperationResults(results)).toEqual({ applied: 1, conflict: 1, failed: 1 })
  })

  test('a retry replaces the results of the retried edits only', () => {
    const first = [
      { id: 'a/1', status: 'applied' as const },
      { id: 'a/2', status: 'failed' as const, message: 'appErrors:record.lockTimeout' },
    ]
    const merged = mergeOperationResults(first, [{ id: 'a/2', status: 'applied' as const }])
    expect(merged).toEqual([
      { id: 'a/1', status: 'applied' },
      { id: 'a/2', status: 'applied' },
    ])
  })

  test('the summary for the model lists the counts and each edit not applied', () => {
    const changeSet = { id: 'cs', surveyId: 1, summary: 's', operations, createdAt: '' }
    const text = summarizeRecordEditResults({
      changeSet,
      results: [
        { id: 'a/1', status: 'applied' },
        { id: 'b/1', status: 'conflict' },
        { id: 'a/2', status: 'failed', message: 'appErrors:record.lockTimeout' },
      ],
    })
    expect(text).toBe(
      'Applied 1 of 3 edits. keys of b, path 1: conflict (the value changed since the proposal, not written). ' +
        'keys of a, path 2: failed (appErrors:record.lockTimeout).'
    )
  })
})
