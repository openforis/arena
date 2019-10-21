import { assert, expect } from 'chai';
import jsep from '../../core/exprParser/helpers/jsep';
import { getWherePreparedStatement } from '../../common/surveyRdb/dataFilter';

const goodExpressions = [
  { q: '1', r: { clause: '$/_0/', params: { _0: '1' } } },
  { q: '1 / 1', r: { clause: '$/_0/ / $/_1/', params: { _0: '1', _1: '1' } } },
  { q: '1 + 1 === 2', r: { clause: '$/_0/ + $/_1/ = $/_2/', params: { _0: '1', _1: '1', _2: '2' } } },
  { q: 'a', r: { clause: '$/_0:name/', params: { _0: 'a' } } },
  { q: '-a', r: { clause: '- $/_0:name/', params: { _0: 'a' } } },
  { q: 'a === 1', r: { clause: '$/_0:name/ = $/_1/', params: { _0: 'a', _1: '1' } } },
  { q: `a !== 'a'`, r: { clause: '$/_0:name/ != $/_1/', params: { _0: 'a', _1: `'a'` } } },
  { q: `a !== "a"`, r: { clause: '$/_0:name/ != $/_1/', params: { _0: 'a', _1: `"a"` } } },
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
  // & is not in the operator white list, so it's substituted with undefined by the converter
  { q: '1 & 1', r: { clause: '$/_0/ undefined $/_1/', params: { _0: '1', _1: '1' } } },
]

const badExpressions = [
  { q: '1 z 1' }, // compound expressions are not converted
  { q: 'a b c d e' }, // compound expressions are not converted
]

describe('dataFilter test', () => {

  goodExpressions.forEach(({ q, r }) =>
    it (q, () => {
      const ps = getWherePreparedStatement(jsep(q))
      assert.deepEqual(ps, r)
    })
  )

  badExpressions.forEach(({ q }) =>
    it (q, () => {
      const ps = () => getWherePreparedStatement(jsep(q))
      expect(ps).to.throw()
    })
  )

})
