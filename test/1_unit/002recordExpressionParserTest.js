import * as R from 'ramda'
import { assert } from 'chai'

import * as NodeDef from '@core/survey/nodeDef'

import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as RecordUtils from '../2_integration/utils/recordUtils'
import * as SB from '../2_integration/utils/surveyBuilder'
import * as RB from '../2_integration/utils/recordBuilder'
import { getContextUser } from '../testContext'

let survey = {}
let record = {}
// Let root = {}
let node = {}
// Let dbh = {}

describe('RecordExpressionParser Test', () => {
  before(async () => {
    const user = getContextUser()

    survey = SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('tree', NodeDef.nodeDefType.integer),
        SB.attribute('dbh', NodeDef.nodeDefType.integer)
      )
    ).build()

    record = RB.record(user, survey, RB.entity('cluster', RB.attribute('tree', 12), RB.attribute('dbh', 18))).build()

    // Root = RecordUtils.findNodeByPath('cluster')(survey, record)
    node = RecordUtils.findNodeByPath('cluster/tree')(survey, record)
    // Dbh = RecordUtils.findNodeByPath('cluster/dbh')(survey, record)
  })

  // ====== nodes hierarchy tests
  // it('this.parent()', async () => {
  //   const res = RecordExpressionParser.evalNodeQuery(survey, record, node, 'this.parent()')
  //   const p = Record.getParentNode(node)(record)
  //   assert.equal(Node.getUuid(res), Node.getUuid(root))
  // })

  // it('this.parent().parent()', async () => {
  //   const res = RecordExpressionParser.evalNodeQuery(survey, record, node, 'this.parent().parent()')
  //   assert.equal(res, null)
  // })

  // it(`dbh`, async () => {
  //   const res = RecordExpressionParser.evalNodeQuery(survey, record, node, `dbh`)
  //   assert.equal(Node.getUuid(res), Node.getUuid(dbh))
  // })

  // it(`dbh`, async () => {
  //   const res = RecordExpressionParser.evalNodeQuery(survey, record, node, `dbh`)
  //   assert.equal(Node.getUuid(res), Node.getUuid(dbh))
  // })

  // ====== value expr tests
  const queries = [
    { q: 'tree + 1', r: 13 },
    { q: 'tree != 1', r: true },
    // !12 == null under strict logical negation semantics
    { q: '!tree', r: null },
    // Number + String is invalid -> null
    { q: 'tree + "1"', r: null },
    { q: '!(tree == 1)', r: true },
    // 18 + 1
    { q: 'dbh + 1', r: 19 },
    // 18 + 1
    { q: 'dbh + 1', r: 19 },
    // 18 + 1 + 12
    { q: 'dbh + 1 + tree', r: 31 },
    // 18 + 12
    { q: 'dbh + tree', r: 30 },
    // 19 >= 12
    { q: 'dbh + 1 >= tree', r: true },
    // 18 * 0.5 >= 12
    { q: '(dbh * 0.5) >= tree', r: false },
    // 1728
    { q: 'pow(tree, 3)', r: 1728 },
    // 18 * 0.5 >= 1728
    { q: '(dbh * 0.5) >= pow(tree, 3)', r: false },
  ]

  queries.forEach(({ q, r }) => {
    it(q, () => {
      const resKeys = R.keys(r)
      const res = RecordExpressionParser.evalNodeQuery(survey, record, node, q)

      if (R.isEmpty(resKeys)) {
        assert.equal(res, r)
      } else {
        resKeys.forEach((key) => assert.equal(res[key], r[key]))
      }
    })
  })
})
