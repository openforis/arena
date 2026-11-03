import pgPromise from 'pg-promise'

import * as Expression from '@core/expressionParser/expression'

const pgp = pgPromise()

const toFormattedSql = (exprString: string, mode: string = Expression.modes.json): string => {
  const { clause, params } = Expression.toSql(Expression.fromString(exprString, mode) as Record<string, unknown>)
  return pgp.as.format(clause, params)
}

type Node = Record<string, unknown>

const identifier = (name: string): Node => ({ type: 'Identifier', name })
const literal = (value: string): Node => ({ type: 'Literal', value, raw: `'${value}'` })
const methodCall = ({
  object = identifier('a'),
  property = identifier('includes'),
  computed = false,
  args = [] as Node[],
}): Node => ({
  type: 'CallExpression',
  callee: { type: 'MemberExpression', object, property, computed },
  arguments: args,
})

describe('Expression.toSql with string methods', () => {
  test.each([
    ["text_attr.includes('abc')", `coalesce(strpos(("text_attr")::text, ('abc')::text) > 0, false)`],
    [
      "text_attr.startsWith('abc')",
      `coalesce(left(("text_attr")::text, length(('abc')::text)) = ('abc')::text, false)`,
    ],
    ["text_attr.endsWith('abc')", `coalesce(right(("text_attr")::text, length(('abc')::text)) = ('abc')::text, false)`],
    [
      "text_attr.toLowerCase().includes('abc')",
      `coalesce(strpos((lower(("text_attr")::text))::text, ('abc')::text) > 0, false)`,
    ],
    ["text_attr.trim().toUpperCase() == 'ABC'", `upper((btrim(("text_attr")::text))::text) IS NOT DISTINCT FROM 'ABC'`],
  ])('%s', (exprString, expectedSql) => {
    expect(toFormattedSql(exprString)).toBe(expectedSql)
  })

  test('same SQL from SQL and JavaScript syntax', () => {
    expect(toFormattedSql("text_attr.includes('abc') AND num = 1", Expression.modes.sql)).toBe(
      toFormattedSql("text_attr.includes('abc') && num == 1")
    )
  })

  test('wildcards and quotes in the searched text are plain characters', () => {
    expect(toFormattedSql(`text_attr.includes("50% o'clock_")`)).toBe(
      `coalesce(strpos(("text_attr")::text, ('50% o''clock_')::text) > 0, false)`
    )
  })

  test.each(['match', 'replace', 'constructor', '__proto__', 'toString'])('method "%s" is not accepted', (name) => {
    expect(() => Expression.toSql(methodCall({ property: identifier(name), args: [literal('x')] }))).toThrow()
  })

  test('computed member call is not accepted', () => {
    expect(() =>
      Expression.toSql(methodCall({ property: literal('includes'), computed: true, args: [literal('x')] }))
    ).toThrow()
  })

  test('wrong number of arguments is not accepted', () => {
    expect(() => Expression.toSql(methodCall({ args: [] }))).toThrow()
    expect(() => Expression.toSql(methodCall({ args: [literal('x'), literal('y')] }))).toThrow()
    expect(() => Expression.toSql(methodCall({ property: identifier('toLowerCase'), args: [literal('x')] }))).toThrow()
  })
})
