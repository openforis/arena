import * as Expression from '@core/expressionParser/expression'
import { Sort } from '@common/model/query'

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
