import { NodesBatchLimits } from '@common/record/nodesBatchLimits'
import { uuidv4 } from '@core/uuid'
import { parseNodesBatchRequest } from '@server/modules/record/service/update/nodesBatch/nodesBatchRequest'
import { RECORD_EDITS_MAX } from '@webapp/ai/changeSets/recordEdits/types'

describe('Batch record edit limits shared by the server and the assistant (341)', () => {
  // the applier sends a change set in one request: the propose tool caps must fit the server limits
  test('a change set at the propose tool caps is accepted by the server request parser', () => {
    expect(RECORD_EDITS_MAX).toBeLessThanOrEqual(NodesBatchLimits.maxEdits)
    const recordUuids = Array.from({ length: NodesBatchLimits.maxRecords }, () => uuidv4())
    const edits = Array.from({ length: RECORD_EDITS_MAX }, (_, index) => ({
      recordUuid: recordUuids[index % recordUuids.length],
      nodeUuid: uuidv4(),
      from: 1,
      to: 2,
    }))
    expect(() => parseNodesBatchRequest({ cycle: '0', edits })).not.toThrow()
  })
})
