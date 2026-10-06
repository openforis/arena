import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

// collects the messages the thread would post to the main thread, so it can run in-process
class TestRecordsUpdateThread extends RecordsUpdateThread {
  messagesPosted: any[]

  constructor() {
    super({})
    this.messagesPosted = []
  }

  postMessage(msg) {
    this.messagesPosted.push(msg)
  }

  getConfirmMessages() {
    return this.messagesPosted.filter((msg) => msg.type === WebSocketEvents.nodesUpdateClearNonApplicableValuesConfirm)
  }
}

const socketId = 'test-socket-id'
const individualsCount = 3

const surveysToDelete: any[] = []

// "distance" is relevant only when there are at least 3 individuals; "dependent" only when "num" > 10
const createSurvey = async ({ keepNonApplicableValues = false } = {}) => {
  const survey = await SB.survey(
    getContextUser(),
    SB.entity(
      'cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
      SB.entity('individual', SB.attribute('individual_no', NodeDef.nodeDefType.integer).key()).multiple(),
      SB.attribute('distance', NodeDef.nodeDefType.decimal).applyIf(`count(individual) >= ${individualsCount}`),
      SB.attribute('num', NodeDef.nodeDefType.integer),
      SB.attribute('dependent', NodeDef.nodeDefType.integer).applyIf('num > 10')
    )
  )
    .props({ keepNonApplicableValues })
    .buildAndStore()
  surveysToDelete.push(survey)
  return survey
}

const createRecord = async (survey) => {
  const individuals = Array.from({ length: individualsCount }, (_, index) =>
    RB.entity('individual', RB.attribute('individual_no', index + 1))
  )
  return RB.record(
    getContextUser(),
    survey,
    RB.entity(
      'cluster',
      RB.attribute('cluster_no', 1),
      ...individuals,
      RB.attribute('distance', 12.5),
      RB.attribute('num', 20),
      RB.attribute('dependent', 7)
    )
  ).buildAndStore()
}

const fetchRecord = async ({ survey, record }) =>
  RecordManager.fetchRecordAndNodesByUuid({ surveyId: Survey.getId(survey), recordUuid: Record.getUuid(record) })

const createMsg = ({ survey, record, ...other }) => ({
  surveyId: Survey.getId(survey),
  cycle: Survey.cycleOneKey,
  draft: false,
  user: getContextUser(),
  timezoneOffset: 0,
  recordUuid: Record.getUuid(record),
  socketId,
  ...other,
})

const deleteLastIndividual = async ({ thread, survey, record, clearNonApplicableValuesConfirmed = false }) => {
  const individualToDelete = RecordUtils.findNodeByPath(`cluster/individual[${individualsCount - 1}]`)(survey, record)
  await thread.processRecordNodeDeleteMsg(
    createMsg({
      survey,
      record,
      type: RecordsUpdateThreadMessageTypes.nodeDelete,
      nodeUuid: Node.getUuid(individualToDelete),
      clearNonApplicableValuesConfirmed,
    })
  )
  return individualToDelete
}

const updateNum = async ({ thread, survey, record, value, clearNonApplicableValuesConfirmed = false }) => {
  const nodeNum = RecordUtils.findNodeByPath('cluster/num')(survey, record)
  await thread.processRecordNodePersistMsg(
    createMsg({
      survey,
      record,
      type: RecordsUpdateThreadMessageTypes.nodePersist,
      node: Node.assocValue(value)(nodeNum),
      clearNonApplicableValuesConfirmed,
    })
  )
}

const getIndividuals = ({ survey, record }) => {
  const individualDef = Survey.getNodeDefByName('individual')(survey)
  return Record.getNodesByDefUuid(NodeDef.getUuid(individualDef))(record)
}

const getValue = ({ survey, record, path }) => RecordUtils.findNodeValueByPath(path)(survey, record)

const isValueBlank = ({ survey, record, path }) => Node.isValueBlank(RecordUtils.findNodeByPath(path)(survey, record))

describe('Records update thread: clear values of attributes becoming non-applicable', () => {
  afterAll(async () => {
    for (const survey of surveysToDelete) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('Entity deletion is not applied until the user confirms it', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey)
    const thread = new TestRecordsUpdateThread()

    const individualDeleted = await deleteLastIndividual({ thread, survey, record })

    const confirmMessages = thread.getConfirmMessages()
    expect(confirmMessages).toHaveLength(1)
    const { content } = confirmMessages[0]
    const distanceDef = Survey.getNodeDefByName('distance')(survey)
    expect(content.socketId).toBe(socketId)
    expect(content.nodeDelete).toBe(true)
    expect(content.nodeDefUuidsToClear).toEqual([NodeDef.getUuid(distanceDef)])
    // the deleted entity and its descendants can be restored by the client
    expect(content.nodesToRestore.map(Node.getUuid)).toContain(Node.getUuid(individualDeleted))
    expect(content.nodesToRestore).toHaveLength(2)

    // nothing changed in the DB
    const recordDb = await fetchRecord({ survey, record })
    expect(getIndividuals({ survey, record: recordDb })).toHaveLength(individualsCount)
    expect(getValue({ survey, record: recordDb, path: 'cluster/distance' })).toBe(12.5)
  })

  test('Entity deletion confirmed: the value of the attribute becoming non-applicable is cleared', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey)
    const thread = new TestRecordsUpdateThread()

    await deleteLastIndividual({ thread, survey, record, clearNonApplicableValuesConfirmed: true })

    expect(thread.getConfirmMessages()).toHaveLength(0)
    const recordDb = await fetchRecord({ survey, record })
    expect(getIndividuals({ survey, record: recordDb })).toHaveLength(individualsCount - 1)
    expect(isValueBlank({ survey, record: recordDb, path: 'cluster/distance' })).toBe(true)
  })

  test('Attribute update is not applied until the user confirms it, then the dependent value is cleared', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey)
    const thread = new TestRecordsUpdateThread()

    await updateNum({ thread, survey, record, value: 5 })

    const confirmMessages = thread.getConfirmMessages()
    expect(confirmMessages).toHaveLength(1)
    const { content } = confirmMessages[0]
    const dependentDef = Survey.getNodeDefByName('dependent')(survey)
    expect(content.nodeDelete).toBe(false)
    expect(content.nodeDefUuidsToClear).toEqual([NodeDef.getUuid(dependentDef)])
    // the stored node (with the old value) can be restored by the client
    expect(content.nodesToRestore.map(Node.getValue)).toEqual([20])

    let recordDb = await fetchRecord({ survey, record })
    expect(getValue({ survey, record: recordDb, path: 'cluster/num' })).toBe(20)
    expect(getValue({ survey, record: recordDb, path: 'cluster/dependent' })).toBe(7)

    await updateNum({ thread, survey, record, value: 5, clearNonApplicableValuesConfirmed: true })

    recordDb = await fetchRecord({ survey, record })
    expect(getValue({ survey, record: recordDb, path: 'cluster/num' })).toBe(5)
    expect(isValueBlank({ survey, record: recordDb, path: 'cluster/dependent' })).toBe(true)
  })

  test('Updates not clearing any value are applied without confirmation', async () => {
    const survey = await createSurvey()
    const record = await createRecord(survey)
    const thread = new TestRecordsUpdateThread()

    await updateNum({ thread, survey, record, value: 30 })

    expect(thread.getConfirmMessages()).toHaveLength(0)
    const recordDb = await fetchRecord({ survey, record })
    expect(getValue({ survey, record: recordDb, path: 'cluster/num' })).toBe(30)
    expect(getValue({ survey, record: recordDb, path: 'cluster/dependent' })).toBe(7)
  })

  test('Survey keeping non-applicable values: no confirmation, values are kept', async () => {
    const survey = await createSurvey({ keepNonApplicableValues: true })
    const record = await createRecord(survey)
    const thread = new TestRecordsUpdateThread()

    await deleteLastIndividual({ thread, survey, record })

    expect(thread.getConfirmMessages()).toHaveLength(0)
    const recordDb = await fetchRecord({ survey, record })
    expect(getIndividuals({ survey, record: recordDb })).toHaveLength(individualsCount - 1)
    expect(getValue({ survey, record: recordDb, path: 'cluster/distance' })).toBe(12.5)
  })
})
