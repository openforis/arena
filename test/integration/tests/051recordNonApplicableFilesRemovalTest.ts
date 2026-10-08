import { UUIDs } from '@openforis/arena-core'

import { db } from '@server/db/db'
import { RecordsUpdateThreadMessageTypes } from '@server/modules/record/service/update/thread/recordsThreadMessageTypes'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as SurveyFile from '@core/survey/surveyFile'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyFileManager from '@server/modules/survey/manager/surveyFileManager'
import * as FileRepository from '@server/modules/record/repository/fileRepository'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { RecordsUpdateThread } from '@server/modules/record/service/update/thread/recordsUpdateThread'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

// the thread posts messages to the parent port, which doesn't exist in the main thread: ignore them
class TestRecordsUpdateThread extends RecordsUpdateThread {
  constructor() {
    super({})
  }

  postMessage() {
    // do nothing
  }
}

const surveysToDelete: any[] = []

// "photo" and the "item" entity (with its own file attribute) are relevant only when num > 10
const createSurvey = async ({ keepNonApplicableValues = false } = {}) => {
  const survey = await SB.survey(
    getContextUser(),
    SB.entity(
      'cluster',
      SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
      SB.attribute('num', NodeDef.nodeDefType.integer),
      SB.attribute('photo', NodeDef.nodeDefType.file).applyIf('num > 10'),
      SB.entity(
        'item',
        SB.attribute('item_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('item_photo', NodeDef.nodeDefType.file)
      )
        .multiple()
        .applyIf('num > 10')
    )
  )
    .props({ keepNonApplicableValues })
    .buildAndStore()
  surveysToDelete.push(survey)
  return survey
}

const newFileValue = () => Node.newNodeValueFile({ fileUuid: UUIDs.v4(), fileName: 'file.txt' })

const buildRecord = ({ survey, photoValue, itemPhotoValue }) =>
  RB.record(
    getContextUser(),
    survey,
    RB.entity(
      'cluster',
      RB.attribute('cluster_no', 1),
      RB.attribute('num', 20),
      RB.attribute('photo', photoValue),
      RB.entity('item', RB.attribute('item_no', 1), RB.attribute('item_photo', itemPhotoValue))
    )
  )

const storeRecord = ({ survey, recordBuilder, preview }) =>
  preview
    ? db.tx(async (t) => {
        const record = await RecordUtils.insertAndInitRecord(getContextUser(), survey, true, t as any)
        return recordBuilder.rootEntityBuilder.buildAndStore(getContextUser(), survey, record, null, t)
      })
    : recordBuilder.buildAndStore()

// creates a record with a file attribute and a file attribute inside a multiple entity, and their files
const createRecordWithFiles = async ({ survey, preview = false }) => {
  const photoValue = newFileValue()
  const itemPhotoValue = newFileValue()
  const record = await storeRecord({
    survey,
    recordBuilder: buildRecord({ survey, photoValue, itemPhotoValue }),
    preview,
  })

  const surveyId = Survey.getId(survey)
  const insertFileOf = async (path, value) => {
    const node = RecordUtils.findNodeByPath(path)(survey, record)
    const file = SurveyFile.createFile({
      uuid: value[Node.valuePropsFile.fileUuid],
      name: 'file.txt',
      size: 4,
      content: Buffer.from('test'),
      recordUuid: Record.getUuid(record),
      nodeUuid: Node.getUuid(node),
      type: SurveyFile.SurveyFileType.recordAttachment,
    })
    await SurveyFileManager.insertFile(surveyId, file)
  }
  await insertFileOf('cluster/photo', photoValue)
  await insertFileOf('cluster/item/item_photo', itemPhotoValue)
  return {
    record,
    photoFileUuid: photoValue[Node.valuePropsFile.fileUuid],
    itemPhotoFileUuid: itemPhotoValue[Node.valuePropsFile.fileUuid],
  }
}

const fetchFile = (survey, fileUuid) => SurveyFileManager.fetchFileSummaryByUuid(Survey.getId(survey), fileUuid)

// sets num to 5, so that photo and item become not relevant
const makeNotRelevant = async ({ survey, record, confirmed = true }) => {
  const thread = new TestRecordsUpdateThread()
  const nodeNum = RecordUtils.findNodeByPath('cluster/num')(survey, record)
  await thread.processRecordNodePersistMsg({
    surveyId: Survey.getId(survey),
    cycle: Survey.cycleOneKey,
    draft: false,
    user: getContextUser(),
    timezoneOffset: 0,
    socketId: 'test-socket-id',
    type: RecordsUpdateThreadMessageTypes.nodePersist,
    node: Node.assocValue(5)(nodeNum),
    clearNonApplicableValuesConfirmed: confirmed,
  })
}

const fetchRecord = (survey, record) =>
  RecordManager.fetchRecordAndNodesByUuid({ surveyId: Survey.getId(survey), recordUuid: Record.getUuid(record) })

describe('Records update thread: files of attributes becoming non-applicable', () => {
  afterAll(async () => {
    for (const survey of surveysToDelete) {
      await SurveyManager.deleteSurvey(Survey.getId(survey)) //NOSONAR
    }
  })

  test('files of cleared attributes and of deleted entities are marked as deleted (normal record)', async () => {
    const survey = await createSurvey()
    const { record, photoFileUuid, itemPhotoFileUuid } = await createRecordWithFiles({ survey })
    expect(SurveyFile.isDeleted(await fetchFile(survey, photoFileUuid))).toBe(false)

    await makeNotRelevant({ survey, record })

    const recordDb = await fetchRecord(survey, record)
    expect(Node.isValueBlank(RecordUtils.findNodeByPath('cluster/photo')(survey, recordDb))).toBe(true)
    expect(RecordUtils.findNodeByPath('cluster/item')(survey, recordDb)).toBeNull()
    // soft delete: the file row (and its content) is kept
    expect(SurveyFile.isDeleted(await fetchFile(survey, photoFileUuid))).toBe(true)
    expect(SurveyFile.isDeleted(await fetchFile(survey, itemPhotoFileUuid))).toBe(true)
  })

  test('files are not touched when the update is not confirmed', async () => {
    const survey = await createSurvey()
    const { record, photoFileUuid, itemPhotoFileUuid } = await createRecordWithFiles({ survey })

    await makeNotRelevant({ survey, record, confirmed: false })

    expect(SurveyFile.isDeleted(await fetchFile(survey, photoFileUuid))).toBe(false)
    expect(SurveyFile.isDeleted(await fetchFile(survey, itemPhotoFileUuid))).toBe(false)
  })

  test('files are not touched when the survey keeps the values of non-applicable attributes', async () => {
    const survey = await createSurvey({ keepNonApplicableValues: true })
    const { record, photoFileUuid } = await createRecordWithFiles({ survey })

    await makeNotRelevant({ survey, record })

    const recordDb = await fetchRecord(survey, record)
    expect(Node.isValueBlank(RecordUtils.findNodeByPath('cluster/photo')(survey, recordDb))).toBe(false)
    expect(SurveyFile.isDeleted(await fetchFile(survey, photoFileUuid))).toBe(false)
  })

  test('files are deleted immediately (content and row) in preview records', async () => {
    const survey = await createSurvey()
    const { record, photoFileUuid, itemPhotoFileUuid } = await createRecordWithFiles({ survey, preview: true })
    expect(await fetchFile(survey, photoFileUuid)).not.toBeNull()

    await makeNotRelevant({ survey, record })

    expect(await fetchFile(survey, photoFileUuid)).toBeNull()
    expect(await fetchFile(survey, itemPhotoFileUuid)).toBeNull()
  })

  test('missing file rows do not make the update fail (normal record)', async () => {
    const survey = await createSurvey()
    const { record, photoFileUuid, itemPhotoFileUuid } = await createRecordWithFiles({ survey })
    await FileRepository.deleteFilesByUuids(Survey.getId(survey), [photoFileUuid])
    expect(await fetchFile(survey, photoFileUuid)).toBeNull()

    await makeNotRelevant({ survey, record })

    const recordDb = await fetchRecord(survey, record)
    expect(Node.isValueBlank(RecordUtils.findNodeByPath('cluster/photo')(survey, recordDb))).toBe(true)
    expect(SurveyFile.isDeleted(await fetchFile(survey, itemPhotoFileUuid))).toBe(true)
  })

  test('missing file rows and contents do not make the update fail (preview record)', async () => {
    const survey = await createSurvey()
    const { record, photoFileUuid, itemPhotoFileUuid } = await createRecordWithFiles({ survey, preview: true })
    await FileRepository.deleteFilesByUuids(Survey.getId(survey), [photoFileUuid])

    await makeNotRelevant({ survey, record })

    const recordDb = await fetchRecord(survey, record)
    expect(Node.isValueBlank(RecordUtils.findNodeByPath('cluster/photo')(survey, recordDb))).toBe(true)
    expect(await fetchFile(survey, itemPhotoFileUuid)).toBeNull()
  })
})
