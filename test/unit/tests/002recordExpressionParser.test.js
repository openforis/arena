import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'

import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as RecordUtils from '../../utils/recordUtils'
import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}
// Let root = {}
let node = {}
// Let dbh = {}

describe('RecordExpressionParser Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('tree_height', NodeDef.nodeDefType.integer),
        SB.attribute('dbh', NodeDef.nodeDefType.integer),
        SB.attribute('visit_date', NodeDef.nodeDefType.date),
        SB.attribute('remarks', NodeDef.nodeDefType.text),
        SB.entity('plot', SB.attribute('plot_id').key(), SB.attribute('plot_multiple_number').multiple()).multiple()
      )
    ).build()

    record = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('tree_height', 12),
        RB.attribute('dbh', 18),
        RB.attribute('visit_date', '2021-01-01'),
        RB.attribute('remarks', ''),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 1),
          RB.attribute('plot_multiple_number', 10),
          RB.attribute('plot_multiple_number', 20)
        ),
        RB.entity('plot', RB.attribute('plot_id', 2)),
        RB.entity('plot', RB.attribute('plot_id', 3), RB.attribute('plot_multiple_number', 30))
      )
    ).build()

    // Root = RecordUtils.findNodeByPath('cluster')(survey, record)
    node = RecordUtils.findNodeByPath('cluster/tree_height')(survey, record)
    // Dbh = RecordUtils.findNodeByPath('cluster/dbh')(survey, record)
  }, 10000)

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
    { q: 'tree_height + 1', r: 13 },
    { q: 'tree_height != 1', r: true },
    // !12 == null under strict logical negation semantics
    { q: '!tree_height', r: null },
    // Number + String is invalid -> null
    { q: 'tree_height + "1"', r: null },
    { q: '!(tree_height == 1)', r: true },
    // 18 + 1
    { q: 'dbh + 1', r: 19 },
    // 18 + 1
    { q: 'dbh + 1', r: 19 },
    // 18 + 1 + 12
    { q: 'dbh + 1 + tree_height', r: 31 },
    // 18 + 12
    { q: 'dbh + tree_height', r: 30 },
    // 19 >= 12
    { q: 'dbh + 1 >= tree_height', r: true },
    // 18 * 0.5 >= 12
    { q: '(dbh * 0.5) >= tree_height', r: false },
    // 1728
    { q: 'pow(tree_height, 3)', r: 1728 },
    // 18 * 0.5 >= 1728
    { q: '(dbh * 0.5) >= pow(tree_height, 3)', r: false },
    // visit_date must be before current date
    { q: 'visit_date <= now()', r: true },
    // tree_height is not empty
    { q: 'isEmpty(tree_height)', r: false },
    // remarks is empty
    { q: 'isEmpty(remarks)', r: true },
    // plot count is 3
    { q: 'plot.length', r: 3 },
    // access multiple entities with index
    { q: 'plot[0].plot_id', r: 1 },
    { q: 'plot[1].plot_id', r: 2 },
    { q: 'plot[2].plot_id', r: 3 },
    { q: 'plot[4].plot_id', r: null },
    // plot_multiple_number counts
    { q: 'plot[0].plot_multiple_number.length', r: 2 },
    { q: 'plot[1].plot_multiple_number.length', r: null },
    { q: 'plot[2].plot_multiple_number.length', r: 1 },
  ]

  queries.forEach(({ q, r }) => {
    it(q, () => {
      const resKeys = R.keys(r)
      const res = RecordExpressionParser.evalNodeQuery(survey, record, node, q)

      if (R.isEmpty(resKeys)) {
        expect(res).toEqual(r)
      } else {
        resKeys.forEach((key) => expect(res[key]).toEqual(r[key]))
      }
    })
  })
})
