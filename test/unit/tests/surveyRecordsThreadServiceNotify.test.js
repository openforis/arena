import { ClusterBus, WebSocketServer, WebSocketEvent, RecordSocketAssociationRepository } from '@openforis/arena-server'
import {
  RecordsUpdateThreadService,
  _handleClusterEventForTest as handleClusterEvent,
} from '../../../server/modules/record/service/update/surveyRecordsThreadService'
import { SurveyRecordsThreadMap } from '../../../server/modules/record/service/update/surveyRecordsThreadMap'
import { RecordsUpdateThreadMessageTypes } from '../../../server/modules/record/service/update/thread/recordsThreadMessageTypes'

describe('RecordsUpdateThreadService notify functions', () => {
  let getSocketIdsByRecordUuidSpy
  let dissocSocketsByRecordUuidSpy
  let dissocSocketSpy
  let isSocketConnectedSpy
  let notifySocketSpy

  beforeAll(() => {
    getSocketIdsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'getSocketIdsByRecordUuid')
    dissocSocketsByRecordUuidSpy = jest.spyOn(RecordSocketAssociationRepository, 'dissocSocketsByRecordUuid')
    dissocSocketSpy = jest.spyOn(RecordSocketAssociationRepository, 'dissocSocket')
    isSocketConnectedSpy = jest.spyOn(WebSocketServer, 'isSocketConnected')
    notifySocketSpy = jest.spyOn(WebSocketServer, 'notifySocket')
  })

  afterAll(() => {
    getSocketIdsByRecordUuidSpy.mockRestore()
    dissocSocketsByRecordUuidSpy.mockRestore()
    dissocSocketSpy.mockRestore()
    isSocketConnectedSpy.mockRestore()
    notifySocketSpy.mockRestore()
  })

  beforeEach(() => {
    getSocketIdsByRecordUuidSpy.mockReset()
    dissocSocketsByRecordUuidSpy.mockReset().mockResolvedValue(undefined)
    dissocSocketSpy.mockReset().mockResolvedValue(undefined)
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

  test('notifyRecordUpdateToSockets notifies a socket that is still connected', async () => {
    getSocketIdsByRecordUuidSpy.mockResolvedValue(['socket-1'])
    isSocketConnectedSpy.mockResolvedValue(true)

    await RecordsUpdateThreadService.notifyRecordUpdateToSockets({
      eventType: WebSocketEvent.nodesUpdate,
      content: { recordUuid: 'record-1' },
    })

    expect(isSocketConnectedSpy).toHaveBeenCalledWith('socket-1')
    expect(notifySocketSpy).toHaveBeenCalledTimes(1)
    expect(notifySocketSpy).toHaveBeenCalledWith('socket-1', WebSocketEvent.nodesUpdate, { recordUuid: 'record-1' })
    expect(dissocSocketSpy).not.toHaveBeenCalled()
  })

  test('notifyRecordUpdateToSockets self-heals by dissociating a socket that is no longer connected', async () => {
    getSocketIdsByRecordUuidSpy.mockResolvedValue(['socket-stale'])
    isSocketConnectedSpy.mockResolvedValue(false)

    await RecordsUpdateThreadService.notifyRecordUpdateToSockets({
      eventType: WebSocketEvent.nodesUpdate,
      content: { recordUuid: 'record-1' },
    })

    expect(isSocketConnectedSpy).toHaveBeenCalledWith('socket-stale')
    expect(dissocSocketSpy).toHaveBeenCalledWith({ recordUuid: 'record-1', socketId: 'socket-stale' })
    expect(notifySocketSpy).not.toHaveBeenCalled()
  })
})

describe('RecordsUpdateThreadService cluster-bus integration', () => {
  let publishSpy

  beforeAll(() => {
    publishSpy = jest.spyOn(ClusterBus, 'publish')
  })

  afterAll(() => {
    publishSpy.mockRestore()
  })

  beforeEach(() => {
    publishSpy.mockReset().mockResolvedValue(undefined)
  })

  test('clearSurveyDataFromThread publishes a cluster event instead of only messaging the local thread', () => {
    RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId: 42, cycle: '0', draft: false })

    expect(publishSpy).toHaveBeenCalledWith({
      targetType: 'recordsUpdateThread',
      targetId: 'survey-42',
      eventType: 'surveyClear',
      message: { surveyId: 42, cycle: '0', draft: false },
    })
  })

  describe('with a local thread registered', () => {
    const threadKey = SurveyRecordsThreadMap.getKey()
    let fakeThread

    beforeEach(() => {
      // register a fake thread in the real thread map, so the service's (non-side-effecting)
      // thread lookup finds it, exactly as it would find a real one
      fakeThread = { postMessage: jest.fn() }
      SurveyRecordsThreadMap.put(threadKey, fakeThread)
    })

    afterEach(() => {
      SurveyRecordsThreadMap.remove(threadKey)
    })

    test("a received surveyClear cluster event posts to this dyno's local thread", () => {
      handleClusterEvent({
        targetType: 'recordsUpdateThread',
        targetId: 'survey-42',
        eventType: 'surveyClear',
        message: { surveyId: 42, cycle: '0', draft: false },
      })

      expect(fakeThread.postMessage).toHaveBeenCalledTimes(1)
      expect(fakeThread.postMessage).toHaveBeenCalledWith({
        type: RecordsUpdateThreadMessageTypes.surveyClear,
        surveyId: 42,
        cycle: '0',
        draft: false,
      })
    })

    test("a received recordClear cluster event posts to this dyno's local thread", () => {
      handleClusterEvent({
        targetType: 'recordsUpdateThread',
        targetId: 'record-1',
        eventType: 'recordClear',
        message: { surveyId: 42, cycle: '0', draft: false, recordUuid: 'record-1' },
      })

      expect(fakeThread.postMessage).toHaveBeenCalledTimes(1)
      expect(fakeThread.postMessage).toHaveBeenCalledWith({
        type: RecordsUpdateThreadMessageTypes.recordClear,
        surveyId: 42,
        cycle: '0',
        draft: false,
        recordUuid: 'record-1',
      })
    })

    test('a cluster event with an unrelated targetType does not reach the local thread', () => {
      handleClusterEvent({
        targetType: 'somethingElse',
        targetId: 'x',
        eventType: 'surveyClear',
        message: {},
      })

      expect(fakeThread.postMessage).not.toHaveBeenCalled()
    })
  })

  test('a cluster event received when no local thread exists is a no-op', () => {
    expect(() =>
      handleClusterEvent({
        targetType: 'recordsUpdateThread',
        targetId: 'survey-42',
        eventType: 'surveyClear',
        message: { surveyId: 42, cycle: '0', draft: false },
      })
    ).not.toThrow()
  })
})
