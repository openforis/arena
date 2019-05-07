const { assert } = require('chai')

const jsep = require('../../common/exprParser/helpers/jsep')
const { getWherePerparedStatement } = require('../../common/surveyRdb/dataFilter')

const expressions = [
  { q: '1', r: { clause: '$/_0/', params: { _0: '1' } } },
  { q: '1 / 1', r: { clause: '$/_0/ / $/_1/', params: { _0: '1', _1: '1' } } },
  { q: '1 + 1 === 2', r: { clause: '$/_0/ + $/_1/ = $/_2/', params: { _0: '1', _1: '1', _2: '2' } } },
  { q: 'a', r: { clause: '$/_0:name/', params: { _0: 'a' } } },
  { q: '-a', r: { clause: '- $/_0:name/', params: { _0: 'a' } } },
  { q: 'a === 1', r: { clause: '$/_0:name/ = $/_1/', params: { _0: 'a', _1: '1' } } },
  { q: `a !== 'a'`, r: { clause: '$/_0:name/ != $/_1/', params: { _0: 'a', _1: `'a'` } } },
  {
    q: `a === 1 && b !== 'b'`,
    r: {
      clause: '$/_0:name/ = $/_1/ AND $/_2:name/ != $/_3/',
      params: { _0: 'a', _1: '1', _2: 'b', _3: `'b'` },
    },
  },
  {
    q: `(a === 1 && b !== 'b') || c > 1`,
    r: {
      clause: '($/_0:name/ = $/_1/ AND $/_2:name/ != $/_3/) OR $/_4:name/ > $/_5/',
      params: { _0: 'a', _1: '1', _2: 'b', _3: '\'b\'', _4: 'c', _5: '1' },
    },
  },
]

describe('dataFilter test', () => {

  expressions.forEach(({ q, r }) =>
    it (q, () => {
      const ps = getWherePerparedStatement(jsep(q))
      assert.deepEqual(ps, r)
    })
  )

})
