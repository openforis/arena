/**
 * Tests for the natural-language → Data Explorer query feature:
 * - `toQuery`: conversion of the (parsed) model answer into a Data Explorer query, with validation of every
 *   node def reference against the Data Explorer rules;
 * - `buildDataQueryGeneratePrompt`: the schema description given to the model.
 * Both are pure functions, so they are tested without going through the LLM gateway.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query, SortCriteria } from '@common/model/query'

import { toQuery } from '@server/modules/ai/service/dataQueryGenerateService'
import { buildDataQueryGeneratePrompt } from '@server/modules/ai/service/prompts/dataQueryGenerate'

import * as DataTest from '../../utils/dataTest'
import * as SurveyUtils from '../../utils/surveyUtils'

import { getContextUser } from '../../integration/config/context'

const cycle = Survey.cycleOneKey
const lang = 'en'

let survey: any = null

const getUuid = (path: string) => NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path }))

const newAiResult = (props: object) => ({
  entity: 'tree',
  mode: Query.modes.aggregate,
  attributes: [],
  dimensions: [],
  measures: [],
  filter: null,
  sort: [],
  ...props,
})

const convert = (props: object) => toQuery({ survey, cycle, lang, aiResult: newAiResult(props) as any })

describe('AI data query generation', () => {
  beforeAll(async () => {
    survey = await DataTest.createTestSurvey({ user: getContextUser() })
  }, 10000)

  describe('toQuery', () => {
    test('aggregate query: number of trees by species', () => {
      const { query, errors } = convert({
        dimensions: ['tree_species'],
        measures: [{ attribute: 'tree', functions: ['cnt'] }],
      })
      expect(errors).toEqual([])
      const treeUuid = getUuid('cluster/plot/tree')
      expect(Query.getEntityDefUuid(query)).toBe(treeUuid)
      expect(Query.isModeAggregate(query)).toBe(true)
      expect(Query.getDimensions(query)).toEqual([getUuid('cluster/plot/tree/tree_species')])
      expect(Query.getMeasures(query)).toEqual({ [treeUuid]: ['cnt'] })
      expect(Query.getAttributeDefUuids(query)).toEqual([])
      expect(Query.hasSelection(query)).toBe(true)
    })

    test('aggregate query with ancestor dimension, measure functions, filter and sort', () => {
      const { query, errors } = convert({
        dimensions: ['plot_id'],
        measures: [{ attribute: 'dbh', functions: ['avg', 'max'] }],
        filter: `dbh > 10 AND tree_type = 'T'`,
        sort: [{ attribute: 'plot_id', order: 'desc' }],
      })
      expect(errors).toEqual([])
      expect(Query.getDimensions(query)).toEqual([getUuid('cluster/plot/plot_id')])
      expect(Query.getMeasures(query)).toEqual({ [getUuid('cluster/plot/tree/dbh')]: ['avg', 'max'] })

      const { clause, params } = Expression.toSql(Query.getFilter(query))
      expect(clause).toMatch(/AND/)
      // single quoted literal converted into a plain string value (not a quoted one)
      expect(Object.values(params)).toEqual(expect.arrayContaining(['dbh', 'tree_type', 'T']))

      const [sortCriteria] = Query.getSort(query)
      expect(SortCriteria.getVariable(sortCriteria)).toBe('plot_id')
      expect(SortCriteria.isOrderDesc(sortCriteria)).toBe(true)
    })

    test('raw query with ancestor attributes and sort', () => {
      const { query, errors } = convert({
        mode: Query.modes.raw,
        attributes: ['cluster_id', 'tree_id', 'dbh'],
        sort: [{ attribute: 'dbh', order: 'desc' }],
      })
      expect(errors).toEqual([])
      expect(Query.isModeRaw(query)).toBe(true)
      expect(Query.getAttributeDefUuids(query)).toEqual([
        getUuid('cluster/cluster_id'),
        getUuid('cluster/plot/tree/tree_id'),
        getUuid('cluster/plot/tree/dbh'),
      ])
      expect(Query.getDimensions(query)).toEqual([])
      expect(SortCriteria.getVariable(Query.getSort(query)[0])).toBe('dbh')
    })

    test('unknown or not queryable entity', () => {
      expect(convert({ entity: 'unknown' }).errors[0]).toMatch(/entity "unknown" not found/)
      // single entity: not queryable
      expect(convert({ entity: 'plot_details' }).errors[0]).toMatch(/entity "plot_details" not found/)
    })

    test('invalid dimensions and measures', () => {
      const { query, errors } = convert({
        dimensions: ['dbh', 'not_existing'],
        measures: [
          { attribute: 'tree', functions: ['sum'] },
          { attribute: 'tree_height', functions: ['foo'] },
          { attribute: 'cluster_distance', functions: ['sum'] },
        ],
      })
      expect(query).toBeNull()
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/"dbh" cannot be used as dimension/),
          expect.stringMatching(/attribute "not_existing" not found/),
          expect.stringMatching(/invalid aggregate function\(s\) sum for measure "tree"/),
          expect.stringMatching(/invalid aggregate function\(s\) foo for measure "tree_height"/),
          expect.stringMatching(/"cluster_distance" cannot be used as measure/),
        ])
      )
    })

    test('missing selection', () => {
      expect(convert({}).errors).toEqual(
        expect.arrayContaining([
          'aggregate mode requires at least one dimension',
          'aggregate mode requires at least one measure',
        ])
      )
      expect(convert({ mode: Query.modes.raw }).errors).toEqual(['raw mode requires at least one attribute'])
    })

    test('invalid filter and sort', () => {
      const { errors } = convert({
        mode: Query.modes.raw,
        attributes: ['tree_id'],
        filter: 'unknown_column > 3',
        sort: [{ attribute: 'dbh', order: 'asc' }],
      })
      expect(errors).toEqual([
        'filter references unknown column "unknown_column"',
        'cannot sort by "dbh": sort attributes must be among the selected attributes',
      ])
      expect(convert({ mode: Query.modes.raw, attributes: ['tree_id'], filter: 'dbh >' }).errors[0]).toMatch(
        /cannot be parsed/
      )
    })
  })

  describe('buildDataQueryGeneratePrompt', () => {
    test('describes entities, attributes and their eligibility', () => {
      const { system, prompt } = buildDataQueryGeneratePrompt({
        survey,
        cycle,
        lang,
        description: 'number of trees by species',
      })
      expect(system).toMatch(/"mode": "raw" \| "aggregate"/)
      expect(system).toMatch(/cnt/)
      expect(prompt).toMatch(/- entity cluster path=cluster/)
      expect(prompt).toMatch(/- entity tree path=cluster\/plot\/tree/)
      expect(prompt).not.toMatch(/- entity plot_details/)
      expect(prompt).toMatch(/- tree_species \(taxon\) \[dimension\] columns=tree_species,tree_species_scientific_name/)
      expect(prompt).toMatch(/- dbh \(decimal\) \[measure\]/)
      expect(prompt).toMatch(/- tree_id \(integer\) \[key\] \[dimension\]\n/)
      expect(prompt).toMatch(/- tree_type \(code\) \[dimension\] category="tree_type"/)
      // attributes in single entities are listed under the multiple entity, but cannot be measures
      expect(prompt).toMatch(/- plot_remarks \(text\)\n/)
      expect(prompt).toMatch(/User request: "number of trees by species"/)
    })

    test('includes the previous error', () => {
      const { prompt } = buildDataQueryGeneratePrompt({
        survey,
        cycle,
        lang,
        description: 'trees',
        previousError: { message: 'entity "trees" not found' },
      })
      expect(prompt).toMatch(/The previous answer was not valid: "entity \\"trees\\" not found"/)
    })
  })
})
