import { NodesBatchLimits } from '@common/record/nodesBatchLimits'
import { uuidv4 } from '@core/uuid'
import { parseNodesBatchRequest } from '@server/modules/record/service/update/nodesBatch/nodesBatchRequest'
import {
  chunkOperationsByRecord,
  EDITS_PER_REQUEST,
  RECORDS_PER_REQUEST,
} from '@webapp/ai/changeSets/recordEdits/recordEditsApplier'

const operation = (recordUuid: string) => ({
  id: uuidv4(),
  type: 'record.attributeUpdate' as const,
  recordUuid,
  nodeUuid: uuidv4(),
  nodeDefUuid: 'def',
  recordKeys: recordUuid,
  path: 'p',
  from: 1,
  to: 2,
  preview: { badge: 'noErrors' as const, messages: [], recordNewErrors: 0 },
  page: { nodeUuid: 'page', nodeDefUuid: 'page-def' },
  display: { from: '1', to: '2' },
})

describe('Batch record edit limits shared by the server and the assistant (341)', () => {
  test('the assistant chunk sizes are the server limits', () => {
    expect(RECORDS_PER_REQUEST).toBe(NodesBatchLimits.maxRecords)
    expect(EDITS_PER_REQUEST).toBe(NodesBatchLimits.maxEdits)
  })

  test('every chunk of the assistant is accepted by the server request parser', () => {
    const recordUuids = Array.from({ length: 130 }, () => uuidv4())
    // 4 edits per record: the edits limit (200) is reached before the records limit (50) on the second chunk
    const operations = recordUuids.flatMap((recordUuid) => Array.from({ length: 4 }, () => operation(recordUuid)))
    const chunks = chunkOperationsByRecord(operations)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      const edits = chunk.map(({ recordUuid, nodeUuid, from, to }) => ({ recordUuid, nodeUuid, from, to }))
      expect(() => parseNodesBatchRequest({ cycle: '0', edits })).not.toThrow()
    }
  })
})
