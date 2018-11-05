const {assert} = require('chai')

const {evalQuery} = require('../../common/exprParser/exprParser')

const queries = [
  {q: '1 + 1', r: 2},
  {q: '3 * 8 - 4', r: 20},
  {q: 'Math.pow(2,3) + 1', r: 9},
  {q: 'Math.pow(2,3) + 1 > 10', r: false},
  {q: 'Math.pow(2,3) + 1 > 10 - 8', r: true},
  {q: '16 / Math.pow(2, 3) - 2', r: 0},
  {q: '16 / (Math.pow(2, 3) - 2)', r: 2.6666666666666665},
  {q: '16 / (Math.pow(2, 3) - 2) === 2.6666666666666665', r: true},
]

describe('ExprParser test', () => {

  queries.forEach(query =>
    it(query.q, async () => {
      const res = await evalQuery(query.q)
      assert.equal(res, query.r)
    })
  )

})