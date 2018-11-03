const R = require('ramda')
const {assert} = require('chai')

const {evalNodeQuery} = require('../../server/record/recordExprParser')

const node = {id: 2, value: 12, name: 'tree'}

const queries = [
  {q: 'this.value + 1', r: 13},
  {q: 'this.value !== 1', r: true},
  {q: '!this.value', r: false},
  {q: '!(this.value === 1)', r: true},
  {q: 'this.parent()', r: {id: 1, name: 'root'}},
  {q: 'this.parent().parent()', r: null},
  {q: `this.parent().node('dbh')`, r: {id: 3, value: 18, name: 'dbh'}},
  //18 + 1
  {q: 'this.parent().node("dbh").value + 1', r: 19},
  //18 + 1
  {q: `this.sibling('dbh').value + 1`, r: 19},
  //18 + 1 + 12
  {q: 'this.parent().node("dbh").value + 1 + this.value', r: 31},
  //18 + 12
  {q: 'this.sibling("dbh").value + this.value', r: 30},
  //19 >= 12
  {q: 'this.parent().node("dbh").value + 1 >= this.value', r: true},
  //18 * 0.5 >= 12
  {q: `(this.sibling('dbh').value * 0.5) >= this.value`, r: false},
  //1728
  {q: `Math.pow(this.value, 3)`, r: 1728},
  // 18 * 0.5 >= 1728
  {q: `(this.sibling("dbh").value * 0.5) >= Math.pow(this.value, 3)`, r: false},
]

describe('RecordExprParser Test', () => {

  queries.forEach(query => {
    const {q, r} = query
    const resKeys = R.keys(r)

    it(q, async () => {
      const res = await evalNodeQuery(node, q)

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