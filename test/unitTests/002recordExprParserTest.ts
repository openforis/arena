const R = require('ramda')
const { assert } = require('chai')

const NodeDef = require('../../core/survey/nodeDef')
const Node = require('../../core/record/node')
const Record = require('../../core/record/record')

const SB = require('../it/utils/surveyBuilder')
const RB = require('../it/utils/recordBuilder')
const RecordUtils = require('../it/utils/recordUtils')
const { getContextUser } = require('../testContext')

const RecordExprParser = require('../../core/record/recordExprParser')

let survey = {}
let record = {}
let root = {}
let node = {}
let dbh = {}

before(async () => {
  const user = getContextUser()

  survey = SB.survey(user,
    SB.entity('cluster',
      SB.attribute('tree', NodeDef.nodeDefType.integer),
      SB.attribute('dbh', NodeDef.nodeDefType.integer),
    )
  ).build()

  record = RB.record(user, survey,
    RB.entity('cluster',
      RB.attribute('tree', 12),
      RB.attribute('dbh', 18),
    )
  ).build()

  root = RecordUtils.findNodeByPath('cluster')(survey, record)
  node = RecordUtils.findNodeByPath('cluster/tree')(survey, record)
  dbh = RecordUtils.findNodeByPath('cluster/dbh')(survey, record)
})

describe('RecordExprParser Test', () => {

  // ====== nodes hierarchy tests
  it('this.parent()', async () => {
    const res = await RecordExprParser.evalNodeQuery(survey, record, node, 'this.parent()')
    const p = Record.getParentNode(node)(record)
    assert.equal(Node.getUuid(res), Node.getUuid(root))
  })

  it('this.parent().parent()', async () => {
    const res = await RecordExprParser.evalNodeQuery(survey, record, node, 'this.parent().parent()')
    assert.equal(res, null)
  })

  it(`this.parent().node('dbh')`, async () => {
    const res = await RecordExprParser.evalNodeQuery(survey, record, node, `this.parent().node('dbh')`)
    assert.equal(Node.getUuid(res), Node.getUuid(dbh))
  })

  it(`this.sibling('dbh')`, async () => {
    const res = await RecordExprParser.evalNodeQuery(survey, record, node, `this.sibling('dbh')`)
    assert.equal(Node.getUuid(res), Node.getUuid(dbh))
  })

  // ====== value expr tests
  const queries = [
    { q: 'this.getValue() + 1', r: 13 },
    { q: 'this.getValue() !== 1', r: true },
    { q: '!this.getValue()', r: false },
    { q: '!(this.getValue() === 1)', r: true },
    //18 + 1
    { q: 'this.parent().node("dbh").getValue() + 1', r: 19 },
    //18 + 1
    { q: `this.sibling('dbh').getValue() + 1`, r: 19 },
    //18 + 1 + 12
    { q: 'this.parent().node("dbh").getValue() + 1 + this.getValue()', r: 31 },
    //18 + 12
    { q: 'this.sibling("dbh").getValue() + this.getValue()', r: 30 },
    //19 >= 12
    { q: 'this.parent().node("dbh").getValue() + 1 >= this.getValue()', r: true },
    //18 * 0.5 >= 12
    { q: `(this.sibling('dbh').getValue() * 0.5) >= this.getValue()`, r: false },
    //1728
    { q: `Math.pow(this.getValue(), 3)`, r: 1728 },
    // 18 * 0.5 >= 1728
    { q: `(this.sibling("dbh").getValue() * 0.5) >= Math.pow(this.getValue(), 3)`, r: false },
  ]

  queries.forEach(query => {
    const { q, r } = query
    const resKeys = R.keys(r)

    it(q, async () => {

      const res = await RecordExprParser.evalNodeQuery(survey, record, node, q)

      if (R.isEmpty(resKeys)) {
        assert.equal(res, r)
      } else {
        resKeys.forEach(key =>
          assert.equal(res[key], r[key])
        )
      }

    })

  })

})