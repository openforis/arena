import * as Node from '@core/record/node'
import * as Record from '@core/record/record'

import { createRecordsProposeEditsTool } from '@webapp/ai/tools/cleaning/recordsProposeEditsTool'
import { RECORD_EDITS_MAX } from '@webapp/ai/changeSets/recordEdits/types'

import {
  cleaningTestRecord,
  cleaningTestSurvey,
  fakeI18n,
  newCleaningSurveyUser,
  newCleaningToolContext,
  newFakeCleaningApi,
  runTool,
  validateWholeRecord,
} from '@test/unit/utils/aiCleaningTestUtils'

import * as RecordUtils from '../../utils/recordUtils'

let survey: any
let record: any

const nodeUuidAt = (path: string) => Node.getUuid(RecordUtils.findNodeByPath(path)(survey, record))

const newTool = (fetchRecordAndNodes: (params: any) => unknown = () => record) => {
  const fake = newFakeCleaningApi({ fetchRecordAndNodes })
  return { tool: createRecordsProposeEditsTool({ api: fake.api, getI18n: () => fakeI18n }) as any, calls: fake.calls }
}

beforeAll(async () => {
  survey = await cleaningTestSurvey()
  record = await validateWholeRecord({ survey, record: cleaningTestRecord({ survey }) })
})

describe('records_proposeEdits', () => {
  test('is a data propose tool of the cleaning area', () => {
    const { tool } = newTool()
    expect(tool).toMatchObject({
      name: 'records_proposeEdits',
      dataClass: 'data',
      effect: 'propose',
      area: ['cleaning'],
    })
    const dataEditor = newCleaningSurveyUser({ survey, groupName: 'dataEditor' })
    expect(tool.requires(newCleaningToolContext({ survey, user: dataEditor }))).toBe(false)
  })

  test('valid edits become a change set; the others are returned to the model', async () => {
    const { tool, calls } = newTool()
    const ctx = newCleaningToolContext({ survey })
    const recordUuid = Record.getUuid(record)
    const result = await runTool(
      tool,
      {
        summary: 'Fix DBH and remarks',
        edits: [
          { recordUuid, nodeUuid: nodeUuidAt('cluster/plot[0]/tree[0]/dbh'), value: '8.5' },
          { recordUuid, nodeUuid: nodeUuidAt('cluster/remarks'), value: 'checked' },
          { recordUuid, nodeUuid: nodeUuidAt('cluster/cluster_distance'), value: 'far' },
          { recordUuid, nodeUuid: 'missing-node', value: '1' },
          { recordUuid, nodeUuid: nodeUuidAt('cluster/plot[0]/tree[1]/dbh'), value: '10.123' },
          { recordUuid, nodeUuid: nodeUuidAt('cluster/remarks'), value: 'twice' },
        ],
      },
      ctx
    )
    // the record is loaded once
    expect(calls.filter((call) => call.name === 'fetchRecordAndNodes')).toHaveLength(1)
    expect(ctx.changeSets).toHaveLength(1)
    const [changeSet] = ctx.changeSets
    expect(result).toEqual({
      changeSetId: changeSet.id,
      proposed: 2,
      rejected: [
        expect.objectContaining({ index: 2, code: 'invalidValue', message: expect.stringContaining('invalidNumber') }),
        expect.objectContaining({ index: 3, code: 'nodeNotFound' }),
        expect.objectContaining({ index: 4, code: 'noChange' }),
        expect.objectContaining({ index: 5, code: 'duplicateEdit' }),
      ],
      shownToUser: true,
    })
    expect(changeSet.summary).toBe('Fix DBH and remarks')
    expect(changeSet.operations[0]).toMatchObject({
      type: 'record.attributeUpdate',
      recordUuid,
      nodeUuid: nodeUuidAt('cluster/plot[0]/tree[0]/dbh'),
      recordKeys: '12',
      path: 'cluster[12] / plot[1] / tree[1] / dbh',
      from: 7,
      to: 8.5,
      display: { from: '7', to: '8.5' },
      preview: { badge: 'noErrors', messages: [], recordNewErrors: 0 },
    })
    // the record editor page of an attribute is its parent entity
    const tree = Record.getParentNode(RecordUtils.findNodeByPath('cluster/plot[0]/tree[0]/dbh')(survey, record))(record)
    expect(changeSet.operations[0].page).toEqual({
      nodeUuid: Node.getUuid(tree),
      nodeDefUuid: Node.getNodeDefUuid(tree),
    })
    expect(changeSet.operations[1]).toMatchObject({ path: 'cluster[12] / remarks', from: '', to: 'checked' })
  })

  test('a record the user may not see refuses all its edits', async () => {
    const { tool } = newTool(() => null)
    const ctx = newCleaningToolContext({ survey })
    const result = await runTool(
      tool,
      { summary: 's', edits: [{ recordUuid: 'other', nodeUuid: 'n', value: '1' }] },
      ctx
    )
    expect(ctx.changeSets).toEqual([])
    expect(result).toEqual({
      error: {
        code: 'invalidProposal',
        message: expect.any(String),
        issues: [{ operation: 0, field: 'recordNotAvailable', message: expect.any(String) }],
      },
    })
  })

  test('a record the user may not edit refuses all its edits', async () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    const analysisRecord = { ...record, step: '3' }
    const { tool } = newTool(() => analysisRecord)
    const ctx = newCleaningToolContext({ survey, user: cleanser })
    const result = await runTool(
      tool,
      {
        summary: 's',
        edits: [{ recordUuid: Record.getUuid(record), nodeUuid: nodeUuidAt('cluster/remarks'), value: 'x' }],
      },
      ctx
    )
    expect(result.error.issues).toEqual([{ operation: 0, field: 'recordNotEditable', message: expect.any(String) }])
    expect(ctx.changeSets).toEqual([])
  })

  test(`more than ${RECORD_EDITS_MAX} edits are refused before any request`, async () => {
    const { tool, calls } = newTool()
    const edits = Array.from({ length: RECORD_EDITS_MAX + 1 }, (_, index) => ({
      recordUuid: 'r',
      nodeUuid: `n${index}`,
      value: '1',
    }))
    const result = await runTool(tool, { summary: 's', edits }, newCleaningToolContext({ survey }))
    expect(result).toEqual({ error: { code: 'tooManyEdits', message: expect.stringContaining('split') } })
    expect(calls).toEqual([])
  })

  test('a value can be cleared with null', async () => {
    const { tool } = newTool()
    const ctx = newCleaningToolContext({ survey })
    await runTool(
      tool,
      {
        summary: 's',
        edits: [{ recordUuid: Record.getUuid(record), nodeUuid: nodeUuidAt('cluster/gps_model'), value: null }],
      },
      ctx
    )
    expect(ctx.changeSets[0].operations[0]).toMatchObject({ from: 'ABC-123-xyz', to: null, display: { to: null } })
  })
})
