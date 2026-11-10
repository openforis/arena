import pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { AggregateFunctionExpression } from '@core/survey/aggregateFunctionExpression'
import { validateAggregateFunction } from '@core/survey/aggregateFunctionValidator'
import { ViewDataNodeDef } from '@common/model/db'
import SqlSelectAggBuilder from '@common/model/db/sql/sqlSelectAggBuilder'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../../integration/config/context'

const pgp = pgPromise()
const errorKeys = Validation.messageKeys.aggregateFunction
const columnNames = ['volume', 'dbh', 'species']

const toSql = (expression: string, names: string[] = columnNames): string =>
  AggregateFunctionExpression.toSql({ expression, columnNames: names })

describe('AggregateFunctionExpression: allowed expressions', () => {
  test.each([
    ['sum(volume) / count(*)', 'sum ( "volume" ) / count ( * )'],
    ['avg(dbh) filter (where dbh > 10)', 'avg ( "dbh" ) FILTER ( WHERE "dbh" > 10 )'],
    ["sum(case when species = 'X' then 1 else 0 end)", `sum ( CASE WHEN "species" = 'X' THEN 1 ELSE 0 END )`],
    ['SUM(Volume) * 1.5e2 - .5', 'sum ( "volume" ) * 1.5e2 - .5'],
    ['count(distinct species)', 'count ( DISTINCT "species" )'],
    [
      'percentile_cont(0.5) within group (order by dbh desc)',
      'percentile_cont ( 0.5 ) WITHIN GROUP ( ORDER BY "dbh" DESC )',
    ],
    [
      "sum(volume) filter (where species in ('a', 'it''s; -- /* x'))",
      `sum ( "volume" ) FILTER ( WHERE "species" IN ( 'a' , 'it''s; -- /* x' ) )`,
    ],
    ['round(avg(dbh)::numeric, 2)', 'round ( avg ( "dbh" ) ::numeric , 2 )'],
    ['avg("dbh"::double precision)', 'avg ( "dbh" ::double precision )'],
    [
      'coalesce(sum(volume), 0) <> 0 and not avg(dbh) is null',
      'coalesce ( sum ( "volume" ) , 0 ) <> 0 AND NOT avg ( "dbh" ) IS NULL',
    ],
    ['sum(volume)*-1', 'sum ( "volume" ) * - 1'],
  ])('%s', (expression, expectedSql) => {
    expect(AggregateFunctionExpression.validate({ expression, columnNames })).toBeNull()
    expect(toSql(expression)).toBe(expectedSql)
  })

  test('column names that are SQL keywords or functions are always quoted', () => {
    expect(toSql('count(user) + sum("select") + max(current_user)', ['user', 'select', 'current_user'])).toBe(
      'count ( "user" ) + sum ( "select" ) + max ( "current_user" )'
    )
  })
})

describe('AggregateFunctionExpression: rejected expressions', () => {
  test.each([
    ['sum(volume); delete from x', errorKeys.expressionInvalid, { text: ';' }],
    ['sum(volume) -- comment', errorKeys.expressionInvalid, { text: '--' }],
    ['sum(volume) /* comment */', errorKeys.expressionInvalid, { text: '/*' }],
    ['sum(volume) + $1', errorKeys.expressionInvalid, { text: '$' }],
    ["species = '$/cycle/'", errorKeys.expressionInvalid, { text: '$' }],
    ['$$x$$', errorKeys.expressionInvalid, { text: '$' }],
    [String.raw`sum(volume) filter (where species = E'\x27')`, errorKeys.expressionInvalid, { text: '\\' }],
    ['sum(public.tree.volume)', errorKeys.expressionInvalid, { text: '.' }],
    ["species || 'x'", errorKeys.expressionInvalid, { text: '|' }],
    ['dbh::regclass', errorKeys.expressionInvalid, { text: '::regclass' }],
    ["max(species 'x')", errorKeys.expressionInvalid, { text: "'x'" }],
    ['0x1F', errorKeys.expressionInvalid, { text: '0' }],
    ['(select max(dbh) from tree)', errorKeys.expressionUnknownColumn, { name: 'select' }],
    ['sum(volume) union select 1', errorKeys.expressionUnknownColumn, { name: 'union' }],
    ['sum(height)', errorKeys.expressionUnknownColumn, { name: 'height' }],
    ['max(current_user)', errorKeys.expressionUnknownColumn, { name: 'current_user' }],
    ['sum("Volume")', errorKeys.expressionUnknownColumn, { name: 'Volume' }],
    ['pg_sleep(10)', errorKeys.expressionFunctionNotAllowed, { name: 'pg_sleep' }],
    ['"volume"(1)', errorKeys.expressionFunctionNotAllowed, { name: 'volume' }],
    ["sum(volume) filter (where species = 'X)", errorKeys.expressionUnterminatedQuote, undefined],
    ['sum("volume)', errorKeys.expressionUnterminatedQuote, undefined],
    ['sum(volume)) + (1', errorKeys.expressionUnbalancedParentheses, undefined],
    ['(sum(volume)', errorKeys.expressionUnbalancedParentheses, undefined],
    ['  ', errorKeys.expressionRequired, undefined],
  ])('%s', (expression, key, params) => {
    expect(AggregateFunctionExpression.validate({ expression, columnNames })).toEqual({ key, params })
    expect(() => toSql(expression)).toThrow()
  })
})

describe('validateAggregateFunction', () => {
  const nodeDef = NodeDef.newNodeDef(null, NodeDef.nodeDefType.decimal, [Survey.cycleOneKey], { name: 'volume' })

  test('valid function', async () => {
    const aggregateFunction = { uuid: 'fn1', name: 'total', expression: 'sum(volume)' }
    const validation = await validateAggregateFunction({ aggregateFunction, nodeDef, columnNames })
    expect(Validation.isValid(validation)).toBe(true)
  })

  test('duplicate name', async () => {
    const nodeDefWithFunctions = NodeDef.mergePropsAdvanced({
      [NodeDef.keysPropsAdvanced.aggregateFunctions]: {
        fn1: { uuid: 'fn1', name: 'total', expression: 'sum(volume)' },
      },
    })(nodeDef)
    const aggregateFunction = { uuid: 'fn2', name: 'total', expression: 'avg(volume)' }
    const validation = await validateAggregateFunction({
      aggregateFunction,
      nodeDef: nodeDefWithFunctions,
      columnNames,
    })
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('expression with not allowed SQL', async () => {
    const aggregateFunction = { uuid: 'fn1', name: 'total', expression: 'sum(volume); select 1' }
    const validation = await validateAggregateFunction({ aggregateFunction, nodeDef, columnNames })
    expect(Validation.isValid(validation)).toBe(false)
    const expressionValidation = Validation.getFieldValidation('expression')(validation)
    expect(Validation.getErrors(expressionValidation)).toEqual([
      { key: errorKeys.expressionInvalid, params: { text: ';' } },
    ])
  })
})

describe('SQL generated from the survey', () => {
  const buildSurvey = ({ formula = 'true', aggregateFunctions = {} } = {}) =>
    SB.survey(
      getContextUser(),
      SB.entity(
        'cluster',
        SB.entity(
          'tree',
          SB.attribute('tree_status'),
          SB.attribute('dbh', NodeDef.nodeDefType.integer).propAdvanced(
            NodeDef.keysPropsAdvanced.aggregateFunctions,
            aggregateFunctions
          ),
          SB.entity('tree_selected')
            .virtual()
            .propAdvanced(NodeDef.keysPropsAdvanced.formula, [
              NodeDefExpression.createExpression({ expression: formula }),
            ])
        ).multiple()
      )
    ).build()

  const virtualEntitySql = async (formula: string): Promise<string> => {
    const survey = await buildSurvey({ formula })
    const { clause, params } = new ViewDataNodeDef(survey, Survey.getNodeDefByName('tree_selected')(survey))
      .virtualExpression
    return pgp.as.format(clause, params)
  }

  test.each([
    [`tree_status == "it's dead"`, `"tree_status" = 'it''s dead'`],
    [`tree_status == "x' OR 1=1 --"`, `"tree_status" = 'x'' OR 1=1 --'`],
    [`dbh > 10.5 && tree_status != 'x'`, `"dbh" > 10.5 AND "tree_status" != 'x'`],
    [`isEmpty(tree_status) && dbh >= -2`, `coalesce(("tree_status")::text, '') = '' AND "dbh" >= - 2`],
  ])('virtual entity formula %s', async (formula, expectedSql) => {
    expect(await virtualEntitySql(formula)).toBe(expectedSql)
  })

  test('virtual entity formula with a function not allowed in SQL', async () => {
    await expect(virtualEntitySql('pg_sleep(10) == 1')).rejects.toThrow()
  })

  const selectAggregateFunction = async (expression: string) => {
    const aggregateFunctions = { fn1: { uuid: 'fn1', name: 'total', expression } }
    const survey = await buildSurvey({ aggregateFunctions })
    const viewDataNodeDef = new ViewDataNodeDef(survey, Survey.getNodeDefByName('tree')(survey))
    const dbhDef = Survey.getNodeDefByName('dbh')(survey)
    const builder = new SqlSelectAggBuilder({ viewDataNodeDef })
    builder.selectMeasure({ aggFunctions: ['fn1'], nodeDefUuid: NodeDef.getUuid(dbhDef), index: 0 })
    return pgp.as.format(builder.selectFields.join(', '), builder.params)
  }

  test('custom aggregate function in the select clause', async () => {
    expect(await selectAggregateFunction("sum(dbh) filter (where tree_status = 'a')")).toBe(
      `( sum ( "dbh" ) FILTER ( WHERE "tree_status" = 'a' ) ) AS "dbh_custom_agg_total"`
    )
  })

  test('custom aggregate function with not allowed SQL is never used', async () => {
    await expect(selectAggregateFunction('sum(dbh)); select 1; --')).rejects.toThrow()
  })
})
