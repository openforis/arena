import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { getLockedRefPropsChanged } from '@core/survey/nodeDefEditGuards'

import { applyChangeSet, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { nodeDefProposeCreateTool } from '@webapp/ai/tools/design/nodeDefProposeCreate'
import { expressionsProposeSetTool } from '@webapp/ai/tools/design/expressionsProposeSet'
import { runTool } from '@webapp/ai/tools/registry'
import { isCardStale } from '@webapp/components/ai/Assistant/changeSetCardModel'
import { createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey, withNodeDef } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// region: code, no category; species: taxon, no taxonomy; country: code, category countries
beforeAll(async () => {
  survey = await buildRefSurvey()
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

// what a publish does to the survey: every node definition becomes published
const publish = (target: any): any =>
  Survey.getNodeDefsArray(target).reduce(
    (acc: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef: { ...nodeDef, published: true } })(acc),
    target
  )

const propose = async (tool: any, input: object, target: any = survey) => {
  const ctx = createToolContext({ survey: target })
  const result: any = await runTool(tool, input, ctx)
  return { result, changeSet: ctx.changeSets[0] as ChangeSet | undefined }
}

// the designer's save, faked: the survey changes as the reducers would change it
const applyWithFakeDeps = async (start: any, changeSet: ChangeSet, operationIds?: string[]) => {
  let current = start
  const puts: any[] = []
  const posts: any[] = []
  const deps: ApplierDeps = {
    getSurvey: () => current,
    getCycle: () => '0',
    isSurveyDirty: () => false,
    postNodeDef: async (nodeDef) => {
      posts.push(nodeDef)
    },
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
  const ids = operationIds ?? changeSet.operations.map((op) => op.id)
  const results = await applyChangeSet({ changeSet, operationIds: ids, deps })
  return { results, puts, posts, survey: current }
}

describe('Apply re-runs the designer guards (380)', () => {
  test('propose, publish, apply: a category change on a published attribute is a conflict with a reason', async () => {
    const { changeSet } = await propose(nodeDefProposeUpdateTool, {
      summary: 'Assign the list',
      changes: [{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }],
    })
    expect(changeSet).toBeDefined()
    expect(findConflicts(changeSet!, survey)).toEqual([])

    const published = publish(survey)
    expect(findConflicts(changeSet!, published)).toEqual([
      {
        id: changeSet!.operations[0].id,
        reason: 'aiAssistant.issues.refEditDisabled',
        params: { name: 'region' },
      },
    ])
    expect(isCardStale({ cardState: { changeSet: changeSet! }, survey: published })).toBe(true)

    const { results, puts } = await applyWithFakeDeps(published, changeSet!)
    expect(results).toEqual([
      {
        id: changeSet!.operations[0].id,
        status: 'conflict',
        message: 'aiAssistant.issues.refEditDisabled',
        params: { name: 'region' },
      },
    ])
    expect(puts).toEqual([])
  })

  test('the same for a taxonomy; a template survey still allows it', async () => {
    const { changeSet } = await propose(nodeDefProposeUpdateTool, {
      summary: 'Assign the taxonomy',
      changes: [{ nodeDefName: 'species', prop: 'taxonomyName', value: 'trees' }],
    })
    const published = publish(survey)
    const { results, puts } = await applyWithFakeDeps(published, changeSet!)
    expect(results[0]).toMatchObject({
      status: 'conflict',
      message: 'aiAssistant.issues.refEditDisabled',
      params: { name: 'species' },
    })
    expect(puts).toEqual([])

    const template = { ...published, template: true }
    expect(findConflicts(changeSet!, template)).toEqual([])
    const applied = await applyWithFakeDeps(template, changeSet!)
    expect(applied.results).toEqual([{ id: changeSet!.operations[0].id, status: 'applied' }])
  })

  test('a "multiple" change on an attribute that was published meanwhile is a conflict', async () => {
    const { changeSet, result } = await propose(nodeDefProposeUpdateTool, {
      summary: 'Allow several',
      changes: [{ nodeDefName: 'country', prop: 'multiple', value: true }],
    })
    expect(result.error).toBeUndefined()
    expect(changeSet).toBeDefined()
    const { results, puts } = await applyWithFakeDeps(publish(survey), changeSet!)
    expect(results[0]).toMatchObject({
      status: 'conflict',
      message: 'aiAssistant.issues.multipleEditDisabled',
      params: { name: 'country' },
    })
    expect(puts).toEqual([])
  })

  test('only the operations that break a rule are conflicts: the others are applied', async () => {
    const { changeSet, result } = await propose(nodeDefProposeUpdateTool, {
      summary: 'Mixed',
      changes: [
        { nodeDefName: 'region', prop: 'categoryName', value: 'land_use' },
        { nodeDefName: 'country', prop: 'multiple', value: true },
        { nodeDefName: 'species', prop: 'taxonomyName', value: 'trees' },
      ],
    })
    expect(result.error).toBeUndefined()
    // only region is published
    const partlyPublished = withNodeDef(survey, 'region', (nodeDef) => ({ ...nodeDef, published: true }))
    const [refOp, multipleOp, taxonOp] = changeSet!.operations
    const { results, puts } = await applyWithFakeDeps(partlyPublished, changeSet!)
    expect(results).toEqual([
      { id: refOp.id, status: 'conflict', message: 'aiAssistant.issues.refEditDisabled', params: { name: 'region' } },
      { id: multipleOp.id, status: 'applied' },
      { id: taxonOp.id, status: 'applied' },
    ])
    expect(puts).toHaveLength(2)
  })

  test('a create under a parent that became a table-rendered entity is a conflict', async () => {
    const { changeSet } = await propose(nodeDefProposeCreateTool, {
      summary: 'Add an entity',
      nodeDefs: [{ parentName: 'cluster', type: 'entity', name: 'site' }],
    })
    expect(changeSet).toBeDefined()
    const asTable = withNodeDef(survey, 'cluster', (nodeDef) =>
      NodeDef.assocLayout(NodeDefLayout.newLayout('0', NodeDefLayout.renderType.table))(nodeDef)
    )
    const { results, posts } = await applyWithFakeDeps(asTable, changeSet!)
    expect(results[0]).toMatchObject({
      status: 'conflict',
      message: 'aiAssistant.issues.entityUnderTable',
      params: { name: 'cluster' },
    })
    expect(posts).toEqual([])
  })

  test('an expression that became invalid (the attribute it uses is gone) is a conflict found by the validator', async () => {
    const { changeSet } = await propose(expressionsProposeSetTool, {
      summary: 'Default',
      nodeDefName: 'country',
      prop: 'defaultValues',
      expressions: [{ expression: 'region' }],
    })
    expect(changeSet).toBeDefined()
    const withoutRegion = Survey.dissocNodeDef(uuidOf('region'))(survey)
    // the sync stale check does not run the validator; Apply does
    const { results, puts } = await applyWithFakeDeps(withoutRegion, changeSet!)
    expect(results[0].status).toBe('conflict')
    expect(results[0].message).toBe('aiAssistant.issues.nodeDefInvalid')
    expect(results[0].params).toMatchObject({
      name: 'country',
      count: 2,
      issues: [
        { key: 'validationErrors:nodeDefEdit.defaultValuesInvalid' },
        { key: 'expression.identifierNotFound', params: { name: 'region' } },
      ],
    })
    expect(puts).toEqual([])
  })

  test('an unchanged survey applies as before', async () => {
    const { changeSet } = await propose(nodeDefProposeUpdateTool, {
      summary: 'Assign the list',
      changes: [{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }],
    })
    const { results, puts } = await applyWithFakeDeps(survey, changeSet!)
    expect(results).toEqual([{ id: changeSet!.operations[0].id, status: 'applied' }])
    expect(puts).toHaveLength(1)
  })
})

describe('getLockedRefPropsChanged: the server guard rule (380)', () => {
  const country = () => getDefByName(survey, 'country')

  test('an unpublished attribute may change its category and taxonomy', () => {
    expect(getLockedRefPropsChanged({ survey, nodeDef: country(), props: { categoryUuid: 'other' } })).toEqual([])
  })

  test('a published attribute may not', () => {
    const published = publish(survey)
    const nodeDef = getDefByName(published, 'country')
    expect(getLockedRefPropsChanged({ survey: published, nodeDef, props: { categoryUuid: 'other' } })).toEqual([
      'categoryUuid',
    ])
    expect(getLockedRefPropsChanged({ survey: published, nodeDef, props: { taxonomyUuid: 'other' } })).toEqual([
      'taxonomyUuid',
    ])
    expect(getLockedRefPropsChanged({ survey: published, nodeDef, props: { categoryUuid: null } })).toEqual([
      'categoryUuid',
    ])
  })

  test('the same value, other props and a template are not refused', () => {
    const published = publish(survey)
    const nodeDef = getDefByName(published, 'country')
    expect(
      getLockedRefPropsChanged({
        survey: published,
        nodeDef,
        props: { categoryUuid: NodeDef.getCategoryUuid(nodeDef) },
      })
    ).toEqual([])
    expect(getLockedRefPropsChanged({ survey: published, nodeDef, props: { labels: { en: 'X' } } })).toEqual([])
    const template = { ...published, template: true }
    expect(getLockedRefPropsChanged({ survey: template, nodeDef, props: { categoryUuid: 'other' } })).toEqual([])
  })
})

describe('NodeDefManager.updateNodeDefProps refuses a category change on a published attribute (380)', () => {
  // the guard runs before any query: a client that only opens the transaction is enough
  const fakeClient: any = { tx: async (fn: (t: unknown) => unknown) => fn({}) }

  const update = async (target: any, props: Record<string, unknown>) => {
    const { updateNodeDefProps } = await import('@server/modules/nodeDef/manager/nodeDefManager')
    const nodeDef = getDefByName(target, 'country')
    return updateNodeDefProps(
      { user: { uuid: 'u' }, survey: target, nodeDefUuid: NodeDef.getUuid(nodeDef), parentUuid: 'p', props },
      fakeClient
    )
  }

  test('the error says which attribute and is a conflict', async () => {
    const published = publish(survey)
    await expect(update(published, { categoryUuid: 'another-category' })).rejects.toMatchObject({
      key: 'appErrors:survey.nodeDefRefLocked',
      params: { name: 'country', prop: 'categoryUuid' },
      statusCode: 409,
    })
  })
})
