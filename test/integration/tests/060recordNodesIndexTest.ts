import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'

import RecordsImportJob from '@server/modules/mobile/service/arenaMobileDataImport/jobs/recordsImportJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

const { integer, text } = NodeDef.nodeDefType

describe('Record nodes index', () => {
  let survey: any = null
  let recordCreated: any = null

  const fetchRecord = (params: object = {}): Promise<any> =>
    RecordManager.fetchRecordAndNodesByUuid({
      surveyId: Survey.getId(survey),
      recordUuid: Record.getUuid(recordCreated),
      ...params,
    })

  // index built from scratch from all the record nodes
  const buildExpectedIndex = (record: any) => {
    const recordWithIndex: any = Record.replaceNodes(Record.getNodes(record))(record)
    return recordWithIndex._nodesIndex
  }

  beforeAll(async () => {
    const user = getContextUser()
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', integer).key(),
        SB.attribute('notes', text),
        SB.entity('plot', SB.attribute('plot_id', integer).key()).multiple()
      )
    ).buildAndStore()

    recordCreated = await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.attribute('notes', 'some notes'),
        RB.entity('plot', RB.attribute('plot_id', 1))
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('is created with all the nodes when a record is created', () => {
    expect(recordCreated._nodesIndex).toBeTruthy()
    expect(recordCreated._nodesIndex).toEqual(buildExpectedIndex(recordCreated))
  })

  test('is created with all the nodes when a record is fetched for update', async () => {
    const record = await fetchRecord()
    expect(record._nodesIndex).toBeTruthy()
    expect(record._nodesIndex).toEqual(buildExpectedIndex(record))
  })

  test('is not created for a read only fetch (e.g. records export), so an import has to build it', async () => {
    const record = await fetchRecord({ fetchForUpdate: false })
    expect(record._nodesIndex).toBeUndefined()

    const nodes = Record.getNodes(record)
    const recordImported: any = Record.replaceNodes(nodes)(record)
    const recordFetched = await fetchRecord()
    expect(recordImported._nodesIndex).toEqual(recordFetched._nodesIndex)
  })

  test('does not contain the invalid nodes removed from an imported record', async () => {
    const surveyWithRefData = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({
      surveyId: Survey.getId(survey),
      advanced: true,
    })
    const recordFetched = await fetchRecord()
    const record = await fetchRecord({ fetchForUpdate: false })
    const nodeInvalidUuid = 'invalid-node-uuid'
    const notesNode: any = Record.getNodesArray(record).find((node: any) => node.value === 'some notes')
    const nodeInvalid = { ...notesNode, uuid: nodeInvalidUuid, parentUuid: 'missing-parent-uuid' }

    const job: any = new (RecordsImportJob as any)({ user: getContextUser(), survey: surveyWithRefData })
    job.currentRecord = { ...record, nodes: { ...Record.getNodes(record), [nodeInvalidUuid]: nodeInvalid } }
    await job.cleanupCurrentRecord()

    const { currentRecord } = job
    expect(Record.getNodeByUuid(nodeInvalidUuid)(currentRecord)).toBeUndefined()
    expect(currentRecord._nodesIndex).toEqual(recordFetched._nodesIndex)
  })
})
