import * as Node from '@core/record/node'
import * as Survey from '@core/survey/survey'

import {
  describeNodePath,
  describeRecordKeys,
  getNodePage,
  getNodeValidationMessages,
} from '@webapp/ai/tools/cleaning/recordNodeDescriber'

import { cleaningTestRecord, cleaningTestSurvey, fakeI18n } from '@test/unit/utils/aiCleaningTestUtils'

import * as RecordUtils from '../../utils/recordUtils'

let survey: any
let record: any
const cycle = Survey.cycleOneKey
const nodeAt = (path: string) => RecordUtils.findNodeByPath(path)(survey, record)

beforeAll(async () => {
  survey = await cleaningTestSurvey()
  record = cleaningTestRecord({ survey })
})

describe('record node describer', () => {
  test('record keys', () => {
    expect(describeRecordKeys({ survey, cycle, record })).toBe('12')
  })

  test('path with the keys of the multiple entities', () => {
    expect(describeNodePath({ survey, cycle, record, node: nodeAt('cluster/plot[0]/tree[1]/dbh') })).toBe(
      'cluster[12] / plot[1] / tree[2] / dbh'
    )
  })

  test('single entities have no keys in the path', () => {
    expect(describeNodePath({ survey, cycle, record, node: nodeAt('cluster/plot[1]/plot_details/plot_remarks') })).toBe(
      'cluster[12] / plot[2] / plot_details / plot_remarks'
    )
  })

  test('the page of a node is its parent entity', () => {
    const tree = nodeAt('cluster/plot[0]/tree[1]')
    expect(getNodePage({ record, node: nodeAt('cluster/plot[0]/tree[1]/dbh') })).toEqual({
      nodeUuid: Node.getUuid(tree),
      nodeDefUuid: Node.getNodeDefUuid(tree),
    })
  })

  test('validation messages of a node', () => {
    const dbh = nodeAt('cluster/plot[0]/tree[0]/dbh')
    const recordWithError = {
      ...record,
      validation: {
        valid: false,
        errors: [],
        warnings: [],
        fields: {
          [Node.getUuid(dbh)]: {
            valid: false,
            errors: [{ key: 'record.attribute.valueInvalid' }],
            warnings: [],
            fields: {},
          },
        },
      },
    }
    expect(getNodeValidationMessages({ survey, record: recordWithError, node: dbh, i18n: fakeI18n })).toEqual([
      'record.attribute.valueInvalid',
    ])
    expect(getNodeValidationMessages({ survey, record, node: dbh, i18n: fakeI18n })).toEqual([])
  })
})
