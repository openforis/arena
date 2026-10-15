import { WebSocketEvent } from '@openforis/arena-server'

import * as Record from '@core/record/record'
import * as Validation from '@core/validation/validation'

import {
  buildNodesUpdateEvent,
  buildNodeValidationsUpdateEvent,
} from '@server/modules/record/service/update/recordSocketEvents'

describe('record socket events shared by the records update thread and the batch processor (345)', () => {
  const record = { uuid: 'record-uuid', nodes: {} }

  test('the nodesUpdate event carries the record and the updated nodes', () => {
    const updatedNodes = { n1: { uuid: 'n1' } }
    expect(buildNodesUpdateEvent({ recordUuid: 'record-uuid', updatedNodes })).toEqual({
      type: WebSocketEvent.nodesUpdate,
      content: { recordUuid: 'record-uuid', updatedNodes },
    })
  })

  test.each([null, undefined, {}])('no event for the empty update %p', (updatedNodes) => {
    expect(buildNodesUpdateEvent({ recordUuid: 'record-uuid', updatedNodes })).toBeNull()
  })

  test('the validation event carries the record uuid, the validity of the merged record and the validations', () => {
    const validations = Validation.newInstance(false, {
      n1: Validation.newInstance(false, {}, [{ key: 'error', valid: false }]),
    })
    const event = buildNodeValidationsUpdateEvent({ record, validations })
    expect(event.type).toBe(WebSocketEvent.nodeValidationsUpdate)
    expect(event.content).toEqual({
      recordUuid: Record.getUuid(record),
      recordValid: Validation.isObjValid(Record.mergeNodeValidations(validations)(record)),
      validations,
    })
  })
})
