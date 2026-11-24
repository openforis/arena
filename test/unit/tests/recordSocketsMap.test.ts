import { RecordSocketAssociationRepository } from '@openforis/arena-server'
import * as RecordSocketsMap from '../../../server/modules/record/service/update/recordSocketsMap'

describe('recordSocketsMap', () => {
  let assocSocketSpy
  let getSocketIdsByRecordUuidSpy

  beforeAll(() => {
    assocSocketSpy = jest.spyOn(RecordSocketAssociationRepository, 'assocSocket')
    getSocketIdsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'getSocketIdsByRecordUuid')
  })

  afterAll(() => {
    assocSocketSpy.mockRestore()
    getSocketIdsByRecordUuidSpy.mockRestore()
  })

  beforeEach(() => {
    assocSocketSpy.mockReset().mockResolvedValue(undefined)
    getSocketIdsByRecordUuidSpy.mockReset().mockResolvedValue(['socket-1', 'socket-2'])
  })

  test('assocSocket forwards to RecordSocketAssociationRepository', async () => {
    await RecordSocketsMap.assocSocket({ recordUuid: 'record-1', socketId: 'socket-1' })
    expect(assocSocketSpy).toHaveBeenCalledWith({
      recordUuid: 'record-1',
      socketId: 'socket-1',
    })
  })

  test('getSocketIdsByRecordUuid forwards and resolves with the repository result', async () => {
    const socketIds = await RecordSocketsMap.getSocketIdsByRecordUuid('record-1')
    expect(getSocketIdsByRecordUuidSpy).toHaveBeenCalledWith('record-1')
    expect(socketIds).toEqual(['socket-1', 'socket-2'])
  })
})
