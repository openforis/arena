import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Node from '@core/record/node'

import { computeRecordEditPreview } from '@webapp/ai/tools/cleaning/recordEditPreview'

import {
  asCleaningRecord,
  asCleaningSurvey,
  cleaningAdminUser,
  fakeI18n,
  surveyIndexProviders,
  validateWholeRecord,
} from '@test/unit/utils/aiCleaningTestUtils'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'
import { getContextUser } from '../../integration/config/context'

let survey: any

const errorExpression = (expression: string) => NodeDefExpression.createExpression({ expression, severity: 'error' })

const newPlotRecord = async ({ plotId, dbh, height }: { plotId: number; dbh: number; height: number | null }) =>
  validateWholeRecord({
    survey,
    record: asCleaningRecord({
      survey,
      record: RB.record(
        getContextUser(),
        survey,
        RB.entity(
          'plot',
          RB.attribute('plot_id', plotId),
          RB.attribute('dbh', dbh),
          RB.attribute('height', height),
          RB.attribute('remarks', 'a')
        )
      ).build(),
    }),
  })

const preview = (record: any, edits: [string, unknown][]) =>
  computeRecordEditPreview({
    user: cleaningAdminUser,
    survey,
    record,
    edits: edits.map(([path, value]) => ({
      node: RecordUtils.findNodeByPath(path)(survey, record),
      value,
      refData: null,
    })),
    ...surveyIndexProviders,
    timezoneOffset: 0,
    lang: 'en',
    i18n: fakeI18n,
  })

const nodeUuidAt = (record: any, path: string) => Node.getUuid(RecordUtils.findNodeByPath(path)(survey, record))

beforeAll(async () => {
  survey = asCleaningSurvey(
    await SB.survey(
      getContextUser(),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('dbh', NodeDef.nodeDefType.decimal).required().expressions(errorExpression('dbh > 0')),
        SB.attribute('height', NodeDef.nodeDefType.decimal).expressions(errorExpression('height <= dbh * 2')),
        SB.attribute('remarks', NodeDef.nodeDefType.text)
      )
    ).build()
  )
})

describe('computeRecordEditPreview', () => {
  test('fixes: the attribute had errors and has none after the edit', async () => {
    const record = await newPlotRecord({ plotId: 1, dbh: -1, height: null })
    const result = await preview(record, [['plot/dbh', 10]])
    expect(result.previewByNodeUuid[nodeUuidAt(record, 'plot/dbh')]).toEqual({ badge: 'fixes', messages: [] })
    expect(result.recordNewErrors).toBe(0)
  })

  test('stillInvalid: the attribute has errors after the edit, with the messages', async () => {
    const record = await newPlotRecord({ plotId: 1, dbh: -1, height: null })
    const result = await preview(record, [['plot/dbh', -5]])
    const dbhPreview = result.previewByNodeUuid[nodeUuidAt(record, 'plot/dbh')]
    expect(dbhPreview.badge).toBe('stillInvalid')
    expect(dbhPreview.messages.length).toBeGreaterThan(0)
  })

  test('noErrors: valid before and after', async () => {
    const record = await newPlotRecord({ plotId: 1, dbh: -1, height: null })
    const result = await preview(record, [['plot/remarks', 'b']])
    expect(result.previewByNodeUuid[nodeUuidAt(record, 'plot/remarks')]).toEqual({ badge: 'noErrors', messages: [] })
  })

  test('new errors of other nodes are counted per record (dependents revalidated)', async () => {
    const record = await newPlotRecord({ plotId: 2, dbh: 10, height: 15 })
    const result = await preview(record, [['plot/dbh', 5]])
    expect(result.previewByNodeUuid[nodeUuidAt(record, 'plot/dbh')].badge).toBe('noErrors')
    expect(result.recordNewErrors).toBe(1)
  })

  test('several edits of a record are previewed together', async () => {
    const record = await newPlotRecord({ plotId: 1, dbh: -1, height: null })
    const result = await preview(record, [
      ['plot/dbh', 10],
      ['plot/remarks', 'b'],
    ])
    expect(result.previewByNodeUuid[nodeUuidAt(record, 'plot/dbh')].badge).toBe('fixes')
    expect(result.previewByNodeUuid[nodeUuidAt(record, 'plot/remarks')].badge).toBe('noErrors')
    expect(Node.getValue(RecordUtils.findNodeByPath('plot/dbh')(survey, result.recordAfter))).toBe(10)
  })

  test('the record given is not modified', async () => {
    const record = await newPlotRecord({ plotId: 1, dbh: -1, height: null })
    await preview(record, [['plot/dbh', 10]])
    expect(Node.getValue(RecordUtils.findNodeByPath('plot/dbh')(survey, record))).toBe(-1)
  })
})

// the survey builder survey has no published flag of its own: asCleaningSurvey sets it
test('the preview survey is the published one', () => {
  expect(Survey.isPublished(Survey.getSurveyInfo(survey))).toBe(true)
})
