import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'

import { buildAssistantDesignPrompt } from '@common/ai/prompts/assistantDesign'
import { applyChangeSet, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import type { ChangeSet, NodeDefUpdateOperation } from '@webapp/ai/changeSets/types'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { runTool } from '@webapp/ai/tools/registry'
import { buildCardRows } from '@webapp/components/ai/Assistant/changeSetCardModel'
import { createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey, withNodeDef } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// region: code, no category; species: taxon, no taxonomy; country: code, category countries
beforeAll(async () => {
  survey = await buildRefSurvey()
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const categoryUuidOf = (name: string) => Category.getUuid(Survey.getCategoryByName(name)(survey))
const taxonomyUuidOf = (name: string) => Taxonomy.getUuid(Survey.getTaxonomyByName(name)(survey))

const propose = async (changes: object[], target: any = survey) => {
  const ctx = createToolContext({ survey: target })
  const result: any = await runTool(nodeDefProposeUpdateTool, { summary: 'Assign lists', changes }, ctx)
  return { result, changeSets: ctx.changeSets }
}

const refChangeSet = (operation: Partial<NodeDefUpdateOperation> = {}): ChangeSet => ({
  id: 'cs',
  surveyId: 7,
  summary: 'Assign lists',
  createdAt: '2026-10-11T10:00:00.000Z',
  operations: [
    {
      id: 'o1',
      type: 'nodeDef.update',
      nodeDefUuid: uuidOf('region'),
      prop: 'categoryUuid',
      from: null,
      to: categoryUuidOf('land_use'),
      ...operation,
    },
  ],
})

const withoutCategory = (target: any, name: string) => {
  const rest = Survey.getCategoriesArray(target).filter((category: any) => Category.getName(category) !== name)
  return Survey.assocCategories(
    Object.fromEntries(rest.map((category: any) => [Category.getUuid(category), category]))
  )(target)
}

// the designer's save, faked: the survey changes as the reducers would change it
const applyWithFakeDeps = async (start: any, changeSet: ChangeSet) => {
  let current = start
  const puts: any[] = []
  const deps: ApplierDeps = {
    getSurvey: () => current,
    getCycle: () => '0',
    isSurveyDirty: () => false,
    postNodeDef: async () => undefined,
    putNodeDefProps: async (params) => {
      puts.push(params)
    },
    onNodeDefCreated: (nodeDef) => {
      current = Survey.assocNodeDef({ nodeDef })(current)
    },
    onNodeDefUpdated: (nodeDef) => {
      current = Survey.assocNodeDef({ nodeDef })(current)
    },
    onNodeDefSaved: () => undefined,
  }
  const operationIds = changeSet.operations.map((op) => op.id)
  const results = await applyChangeSet({ changeSet, operationIds, deps })
  return { results, puts, survey: current }
}

describe('nodeDef_proposeUpdate with categoryName / taxonomyName (225)', () => {
  test('resolves the names to uuids and records the previous value', async () => {
    const { result, changeSets } = await propose([
      { nodeDefName: 'region', prop: 'categoryName', value: 'land_use' },
      { nodeDefName: 'species', prop: 'taxonomyName', value: 'trees' },
    ])
    expect(result.error).toBeUndefined()
    expect(changeSets[0].operations).toEqual([
      expect.objectContaining({
        type: 'nodeDef.update',
        nodeDefUuid: uuidOf('region'),
        prop: 'categoryUuid',
        from: null,
        to: categoryUuidOf('land_use'),
      }),
      expect.objectContaining({
        nodeDefUuid: uuidOf('species'),
        prop: 'taxonomyUuid',
        from: null,
        to: taxonomyUuidOf('trees'),
      }),
    ])
  })

  test('refuses a wrong type, an unknown name, a non-string value and the same value', async () => {
    const integer = await propose([{ nodeDefName: 'cluster_id', prop: 'categoryName', value: 'land_use' }])
    expect(integer.result.error.code).toBe('invalidInput')
    expect(integer.result.error.message).toContain('code')
    const taxon = await propose([{ nodeDefName: 'species', prop: 'categoryName', value: 'land_use' }])
    expect(taxon.result.error.code).toBe('invalidInput')
    const unknownCategory = await propose([{ nodeDefName: 'region', prop: 'categoryName', value: 'colours' }])
    expect(unknownCategory.result.error.code).toBe('categoryNotFound')
    expect(unknownCategory.result.error.message).toContain('categories_list')
    const unknownTaxonomy = await propose([{ nodeDefName: 'species', prop: 'taxonomyName', value: 'birds' }])
    expect(unknownTaxonomy.result.error.code).toBe('taxonomyNotFound')
    const notString = await propose([{ nodeDefName: 'region', prop: 'categoryName', value: true }])
    expect(notString.result.error.code).toBe('invalidInput')
    const same = await propose([{ nodeDefName: 'country', prop: 'categoryName', value: 'countries' }])
    expect(same.result.error.code).toBe('noChange')
    const longName = await propose([{ nodeDefName: 'cluster_id', prop: 'name', value: 'x'.repeat(41) }])
    expect(longName.result.error.code).toBe('invalidInput')
  })

  test('a published attribute or the parent of another code attribute is refused; a template allows it', async () => {
    const published = withNodeDef(survey, 'region', (nodeDef) => ({ ...nodeDef, published: true }))
    const refused = await propose([{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }], published)
    expect(refused.result.error.code).toBe('invalidProposal')
    expect(refused.result.error.issues[0].message).toContain('aiAssistant.issues.refEditDisabled')
    const template = await propose([{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }], {
      ...published,
      template: true,
    })
    expect(template.changeSets).toHaveLength(1)
    const parentCode = withNodeDef(survey, 'country', (nodeDef) =>
      NodeDef.assocProp({ key: 'parentCodeDefUuid', value: uuidOf('region') })(nodeDef)
    )
    const parent = await propose([{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }], parentCode)
    expect(parent.result.error.code).toBe('invalidProposal')
    expect(parent.result.error.issues.map((issue: any) => issue.message).join(' ')).toContain('refEditDisabled')
    const publishedTaxon = withNodeDef(survey, 'species', (nodeDef) => ({ ...nodeDef, published: true }))
    const taxon = await propose([{ nodeDefName: 'species', prop: 'taxonomyName', value: 'trees' }], publishedTaxon)
    expect(taxon.result.error.code).toBe('invalidProposal')
  })

  test('conflicts: the category was deleted or changed meanwhile', async () => {
    expect(findConflicts(refChangeSet(), survey)).toEqual([])
    const deleted = withoutCategory(survey, 'land_use')
    expect(findConflicts(refChangeSet(), deleted)).toEqual([{ id: 'o1', reason: 'refMissing' }])
    const changedByHand = withNodeDef(survey, 'region', (nodeDef) =>
      NodeDef.assocProp({ key: 'categoryUuid', value: categoryUuidOf('countries') })(nodeDef)
    )
    expect(findConflicts(refChangeSet(), changedByHand)).toEqual([{ id: 'o1', reason: 'valueChanged' }])
    const { results, puts } = await applyWithFakeDeps(deleted, refChangeSet())
    expect(results).toEqual([{ id: 'o1', status: 'conflict', message: 'refMissing' }])
    expect(puts).toEqual([])
  })

  test('card rows show the category and taxonomy names', () => {
    const rows = buildCardRows({
      cardState: { changeSet: refChangeSet({ from: categoryUuidOf('countries') }) },
      survey,
      lang: 'en',
    })
    expect(rows[0]).toMatchObject({
      nodeDefName: 'region',
      titleKey: 'aiAssistant.card.props.categoryUuid',
      from: { kind: 'text', text: 'countries' },
      to: { kind: 'text', text: 'land_use' },
    })
    const taxonomyRows = buildCardRows({
      cardState: {
        changeSet: refChangeSet({ nodeDefUuid: uuidOf('species'), prop: 'taxonomyUuid', to: taxonomyUuidOf('trees') }),
      },
      survey,
      lang: 'en',
    })
    expect(taxonomyRows[0]).toMatchObject({
      titleKey: 'aiAssistant.card.props.taxonomyUuid',
      from: { kind: 'text', text: null },
      to: { kind: 'text', text: 'trees' },
    })
  })

  test("Apply saves the uuid with the designer's save and leaves the parent code alone", async () => {
    const { results, puts, survey: after } = await applyWithFakeDeps(survey, refChangeSet())
    expect(results).toEqual([{ id: 'o1', status: 'applied' }])
    expect(puts).toHaveLength(1)
    expect(puts[0].props).toEqual({ categoryUuid: categoryUuidOf('land_use') })
    expect(NodeDef.getCategoryUuid(getDefByName(after, 'region'))).toBe(categoryUuidOf('land_use'))
  })

  test('the Design prompt explains how to assign a category or a taxonomy', () => {
    const prompt = buildAssistantDesignPrompt({
      uiLang: 'en',
      surveyName: 'demo',
      surveyLabel: 'Demo',
      languages: ['en'],
      cycle: '0',
      viewDescription: null,
    })
    expect(prompt).toContain('categories_list')
    expect(prompt).toContain('taxonomyName')
  })
})
