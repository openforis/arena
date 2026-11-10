import * as Expression from '@core/expressionParser/expression'
import { Sort } from '@common/model/query'
import * as DbUtils from '@server/db/dbUtils'

const identifier = (name: string) => ({ type: 'Identifier', name })
const literal = (value: string) => ({ type: 'Literal', value, raw: value })

describe('Expression.toSql with client provided expressions', () => {
  test('known unary operators are converted', () => {
    const { clause } = Expression.toSql({ type: 'UnaryExpression', operator: '!', argument: identifier('a') })
    expect(clause).toBe('NOT($/_0:name/)')
  })

  test('unknown unary operator throws', () => {
    const expression = {
      type: 'UnaryExpression',
      operator: '1=1) OR (SELECT pg_sleep(5)) IS NULL OR (',
      argument: identifier('a'),
    }
    expect(() => Expression.toSql(expression)).toThrow()
  })

  test.each(['constructor', 'toString', '__proto__'])('prototype key "%s" is not accepted as operator', (key) => {
    expect(() => Expression.toSql({ type: 'UnaryExpression', operator: key, argument: identifier('a') })).toThrow()
    expect(() =>
      Expression.toSql({ type: 'BinaryExpression', operator: key, left: literal('1'), right: literal('1') })
    ).toThrow()
    expect(() =>
      Expression.toSql({ type: 'CallExpression', callee: identifier(key), arguments: [literal('1')] })
    ).toThrow()
    expect(() => Expression.toSql({ type: key })).toThrow()
  })
})

describe('Expression.toSql with allowed identifiers and table alias', () => {
  const expression = {
    type: 'BinaryExpression',
    operator: '==',
    left: identifier('a'),
    right: { type: 'CallExpression', callee: identifier('isEmpty'), arguments: [identifier('b')] },
  }

  test('allowed identifiers are qualified with the table alias', () => {
    const { clause, params } = Expression.toSql(
      expression,
      {},
      { allowedIdentifiers: new Set(['a', 'b']), tableAlias: 't' }
    )
    expect(clause).toBe(`$/_1:name/.$/_0:name/ IS NOT DISTINCT FROM coalesce(($/_3:name/.$/_2:name/)::text, '') = ''`)
    expect(params).toEqual({ _0: 'a', _1: 't', _2: 'b', _3: 't' })
  })

  test.each(['c', 'email', 'constructor'])('identifier "%s" not allowed throws', (name) => {
    expect(() =>
      Expression.toSql({ ...expression, left: identifier(name) }, {}, { allowedIdentifiers: new Set(['a', 'b']) })
    ).toThrow('appErrors:expression.identifierNotFound')
  })
})

describe('Sort.toSql', () => {
  test('only ASC or DESC end up in the SQL', () => {
    const sort = [
      { variable: 'a', order: 'desc' },
      { variable: 'b', order: 'DESC' },
      { variable: 'c', order: 'asc' },
      { variable: 'd', order: null },
      { variable: 'e', order: 'DESC; DELETE FROM survey_1.record --' },
    ]
    const { clause, params } = Sort.toSql(sort)
    expect(clause).toBe(
      ' $/sort_0:name/ DESC,  $/sort_1:name/ DESC,  $/sort_2:name/ ASC,  $/sort_3:name/ ASC,  $/sort_4:name/ ASC'
    )
    expect(params).toEqual({ sort_0: 'a', sort_1: 'b', sort_2: 'c', sort_3: 'd', sort_4: 'e' })
  })
})

describe('DbUtils limit and offset normalization', () => {
  test.each([
    [10, 10],
    ['10', 10],
    [null, null],
    [undefined, null],
    [0, null],
    [-1, null],
    [1.5, null],
    ['10; DELETE FROM survey_1.record', null],
  ])('normalizeLimit(%p) = %p', (limit, expected) => {
    expect(DbUtils.normalizeLimit(limit)).toBe(expected)
  })

  test.each([
    [10, 10],
    ['10', 10],
    [null, 0],
    [undefined, 0],
    [-1, 0],
    ['0; DELETE FROM survey_1.record', 0],
  ])('normalizeOffset(%p) = %p', (offset, expected) => {
    expect(DbUtils.normalizeOffset(offset)).toBe(expected)
  })
})
