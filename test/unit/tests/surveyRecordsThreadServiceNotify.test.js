import { WebSocketServer, WebSocketEvent, RecordSocketAssociationRepository } from '@openforis/arena-server'
import { RecordsUpdateThreadService } from '../../../server/modules/record/service/update/surveyRecordsThreadService'

describe('RecordsUpdateThreadService notify functions', () => {
  let getSocketIdsByRecordUuidSpy
  let dissocSocketsByRecordUuidSpy
  let isSocketConnectedSpy
  let notifySocketSpy

  beforeAll(() => {
    getSocketIdsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'getSocketIdsByRecordUuid')
    dissocSocketsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'dissocSocketsByRecordUuid')
    isSocketConnectedSpy = jest.spyOn(WebSocketServer, 'isSocketConnected')
    notifySocketSpy = jest.spyOn(WebSocketServer, 'notifySocket')
  })

  afterAll(() => {
    getSocketIdsByRecordUuidSpy.mockRestore()
    dissocSocketsByRecordUuidSpy.mockRestore()
    isSocketConnectedSpy.mockRestore()
    notifySocketSpy.mockRestore()
  })

  beforeEach(() => {
    getSocketIdsByRecordUuidSpy.mockReset()
    dissocSocketsByRecordUuidSpy.mockReset().mockResolvedValue(undefined)
    isSocketConnectedSpy.mockReset()
    notifySocketSpy.mockReset()
  })

  test('notifyRecordDeleteToSockets awaits the async socket lookup before notifying', async () => {
    getSocketIdsByRecordUuidSpy.mockResolvedValue(['socket-1', 'socket-2'])

    await RecordsUpdateThreadService.notifyRecordDeleteToSockets({
      socketIdUser: 'socket-1',
      recordUuid: 'record-1',
      notifySameUser: false,
    })

    expect(notifySocketSpy).toHaveBeenCalledTimes(1)
    expect(notifySocketSpy).toHaveBeenCalledWith('socket-2', WebSocketEvent.recordDelete, 'record-1')
    expect(dissocSocketsByRecordUuidSpy).toHaveBeenCalledWith('record-1')
  })
})
