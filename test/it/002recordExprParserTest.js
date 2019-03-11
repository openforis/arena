const R = require('ramda')
const {assert} = require('chai')

const Node = require('../../common/record/node')
const {evalNodeQuery} = require('../../server/modules/record/recordExprParser')

const survey = {}

const record = {}
const root = {id: 1, name: 'root'}
const tree = {id: 2, value: 12, name: 'tree'}

const newNode = name => ({id: 3, value: 18, name})

const bindNodeFunctions = (survey, record, node) => ({
  ...node,
  parent: async () => node.id === 1 ? null : bindNodeFunctions(survey, record, root),
  node: async name => bindNodeFunctions(survey, record, newNode(name)),
  sibling: async name => bindNodeFunctions(survey, record, newNode(name)),
  getValue: () => Node.getNodeValue(node),
})

const node = bindNodeFunctions(survey, record, tree)

const queries = [
  {q: 'this.getValue() + 1', r: 13},
  {q: 'this.getValue() !== 1', r: true},
  {q: '!this.getValue()', r: false},
  {q: '!(this.getValue() === 1)', r: true},
  {q: 'this.parent()', r: root},
  {q: 'this.parent().parent()', r: null},
  {q: `this.parent().node('dbh')`, r: newNode('dbh')},
  {q: `this.sibling('dbh')`, r: newNode('dbh')},
  //18 + 1
  {q: 'this.parent().node("dbh").getValue() + 1', r: 19},
  //18 + 1
  {q: `this.sibling('dbh').getValue() + 1`, r: 19},
  //18 + 1 + 12
  {q: 'this.parent().node("dbh").getValue() + 1 + this.getValue()', r: 31},
  //18 + 12
  {q: 'this.sibling("dbh").getValue() + this.getValue()', r: 30},
  //19 >= 12
  {q: 'this.parent().node("dbh").getValue() + 1 >= this.getValue()', r: true},
  //18 * 0.5 >= 12
  {q: `(this.sibling('dbh').getValue() * 0.5) >= this.getValue()`, r: false},
  //1728
  {q: `Math.pow(this.getValue(), 3)`, r: 1728},
  // 18 * 0.5 >= 1728
  {q: `(this.sibling("dbh").getValue() * 0.5) >= Math.pow(this.getValue(), 3)`, r: false},
]

describe('RecordExprParser Test', () => {

  queries.forEach(query => {
    const {q, r} = query
    const resKeys = R.keys(r)

    it(q, async () => {

      const res = await evalNodeQuery(survey, {}, node, q, null, bindNodeFunctions)

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