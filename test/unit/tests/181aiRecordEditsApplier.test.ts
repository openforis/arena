import {
  applyRecordEdits,
  chunkOperationsByRecord,
  RECORDS_PER_REQUEST,
} from '@webapp/ai/changeSets/recordEdits/recordEditsApplier'

const operation = (recordUuid: string, nodeUuid: string, id = `${recordUuid}/${nodeUuid}`) => ({
  id,
  type: 'record.attributeUpdate' as const,
  recordUuid,
  nodeUuid,
  nodeDefUuid: 'def',
  recordKeys: recordUuid,
  path: nodeUuid,
  from: 1,
  to: 2,
  preview: { badge: 'noErrors' as const, messages: [], recordNewErrors: 0 },
  page: { nodeUuid: 'page', nodeDefUuid: 'page-def' },
  display: { from: '1', to: '2' },
})

const changeSetOf = (operations: any[]) => ({
  id: 'cs',
  surveyId: 1,
  summary: 's',
  operations,
  createdAt: '2026-10-07T00:00:00Z',
})

const applied = (edits: any[]) => edits.map((_edit, index) => ({ index, status: 'applied' as const }))

describe('chunkOperationsByRecord', () => {
  test('at most 50 records per chunk; the edits of a record stay together, in order', () => {
    const operations = Array.from({ length: 120 }, (_, index) => operation(`r${index}`, 'n1'))
    operations.splice(1, 0, operation('r0', 'n2'))
    const chunks = chunkOperationsByRecord(operations)
    expect(chunks.map((chunk) => new Set(chunk.map((op) => op.recordUuid)).size)).toEqual([50, 50, 20])
    expect(chunks[0].slice(0, 2).map((op) => op.id)).toEqual(['r0/n1', 'r0/n2'])
    expect(chunks.flat()).toHaveLength(121)
    expect(RECORDS_PER_REQUEST).toBe(50)
  })

  test('an edit of a record met before goes to that record’s chunk', () => {
    const chunks = chunkOperationsByRecord([operation('a', '1'), operation('b', '1'), operation('a', '2')], 1)
    expect(chunks.map((chunk) => chunk.map((op) => op.id))).toEqual([['a/1', 'a/2'], ['b/1']])
  })
})

describe('applyRecordEdits', () => {
  test('posts each chunk and merges the results by edit, in operation order', async () => {
    const operations = Array.from({ length: 60 }, (_, index) => operation(`r${index}`, 'n'))
    const requests: any[] = []
    const progress: any[] = []
    const post = async (request: any) => {
      requests.push(request)
      return request.edits.map((_edit: any, index: number) =>
        index === 0 ? { index, status: 'conflict' } : { index, status: 'applied' }
      )
    }
    const results = await applyRecordEdits({
      changeSet: changeSetOf(operations),
      operationIds: operations.map((op) => op.id),
      cycle: '0',
      timezoneOffset: -60,
      lang: 'en',
      post,
      onProgress: (done, total) => progress.push([done, total]),
    })
    expect(requests).toHaveLength(2)
    expect(requests[0]).toEqual({
      surveyId: 1,
      cycle: '0',
      timezoneOffset: -60,
      lang: 'en',
      edits: operations.slice(0, 50).map(({ recordUuid, nodeUuid, from, to }) => ({ recordUuid, nodeUuid, from, to })),
    })
    expect(progress).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ])
    expect(results).toHaveLength(60)
    expect(results[0]).toEqual({ id: 'r0/n', status: 'conflict' })
    expect(results[1]).toEqual({ id: 'r1/n', status: 'applied' })
    expect(results[50]).toEqual({ id: 'r50/n', status: 'conflict' })
  })

  test('only the selected edits are sent', async () => {
    const operations = [operation('a', '1'), operation('a', '2'), operation('b', '1')]
    const requests: any[] = []
    const results = await applyRecordEdits({
      changeSet: changeSetOf(operations),
      operationIds: ['a/2', 'b/1'],
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      post: async (request: any) => {
        requests.push(request)
        return applied(request.edits)
      },
    })
    expect(requests[0].edits.map((edit: any) => `${edit.recordUuid}/${edit.nodeUuid}`)).toEqual(['a/2', 'b/1'])
    expect(results.map((result) => result.id)).toEqual(['a/2', 'b/1'])
  })

  test('failed results keep the server message key and params', async () => {
    const operations = [operation('a', '1')]
    const results = await applyRecordEdits({
      changeSet: changeSetOf(operations),
      operationIds: ['a/1'],
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      post: async () => [{ index: 0, status: 'failed', messageKey: 'appErrors:record.lockTimeout', params: { s: 10 } }],
    })
    expect(results).toEqual([
      { id: 'a/1', status: 'failed', message: 'appErrors:record.lockTimeout', params: { s: 10 } },
    ])
  })

  test('a failed request fails its chunk only, with the error key or a network error', async () => {
    const operations = Array.from({ length: 51 }, (_, index) => operation(`r${index}`, 'n'))
    let call = 0
    const post = async (request: any) => {
      call += 1
      if (call === 1)
        throw Object.assign(new Error('403'), { response: { data: { key: 'appErrors:forbidden', params: {} } } })
      if (call === 2) return applied(request.edits)
      return []
    }
    const results = await applyRecordEdits({
      changeSet: changeSetOf(operations),
      operationIds: operations.map((op) => op.id),
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      post,
    })
    expect(results[0]).toEqual({ id: 'r0/n', status: 'failed', message: 'appErrors:forbidden', params: {} })
    expect(results[50]).toEqual({ id: 'r50/n', status: 'applied' })

    const offline = await applyRecordEdits({
      changeSet: changeSetOf([operation('a', '1')]),
      operationIds: ['a/1'],
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      post: async () => {
        throw new Error('Network Error')
      },
    })
    expect(offline).toEqual([{ id: 'a/1', status: 'failed', message: 'appErrors:networkError' }])
  })

  test('an edit without a result in the response is failed', async () => {
    const results = await applyRecordEdits({
      changeSet: changeSetOf([operation('a', '1')]),
      operationIds: ['a/1'],
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      post: async () => [],
    })
    expect(results).toEqual([
      { id: 'a/1', status: 'failed', message: 'appErrors:generic', params: { text: 'no result' } },
    ])
  })

  test('a request timeout is failed with the apply timeout key, and the signal is forwarded', async () => {
    const controller = new AbortController()
    const requests: any[] = []
    const results = await applyRecordEdits({
      changeSet: changeSetOf([operation('a', '1')]),
      operationIds: ['a/1'],
      cycle: '0',
      timezoneOffset: 0,
      lang: 'en',
      signal: controller.signal,
      post: async (request: any) => {
        requests.push(request)
        throw Object.assign(new Error('timeout'), { code: 'ECONNABORTED' })
      },
    })
    expect(requests[0].signal).toBe(controller.signal)
    expect(results).toEqual([{ id: 'a/1', status: 'failed', message: 'appErrors:aiApplyTimeout' }])
  })
})
