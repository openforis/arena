import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import en from '@core/i18n/resources/en/common'
import es from '@core/i18n/resources/es/common'
import fr from '@core/i18n/resources/fr/common'
import ja from '@core/i18n/resources/ja/common'
import mn from '@core/i18n/resources/mn/common'
import pt from '@core/i18n/resources/pt/common'
import ru from '@core/i18n/resources/ru/common'
import enErrors from '@core/i18n/resources/en/appErrors'
import esErrors from '@core/i18n/resources/es/appErrors'
import frErrors from '@core/i18n/resources/fr/appErrors'
import jaErrors from '@core/i18n/resources/ja/appErrors'
import mnErrors from '@core/i18n/resources/mn/appErrors'
import ptErrors from '@core/i18n/resources/pt/appErrors'
import ruErrors from '@core/i18n/resources/ru/appErrors'

import { applyChangeSet, type ApplierDeps } from '@webapp/ai/changeSets/applyChangeSet'
import { findStructuralConflicts, findValidationConflicts } from '@webapp/ai/changeSets/designerRuleConflicts'
import { isI18nKeyReason } from '@webapp/ai/changeSets/types'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { nodeDefGetTool } from '@webapp/ai/tools/design/nodeDefGet'
import { nodeDefProposeCreateTool } from '@webapp/ai/tools/design/nodeDefProposeCreate'
import { expressionsProposeSetTool } from '@webapp/ai/tools/design/expressionsProposeSet'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { runTool } from '@webapp/ai/tools/registry'
import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey } from '@test/unit/utils/designSuggestionTestUtils'

const commonByLang: Record<string, any> = { en, es, fr, ja, mn, pt, ru }
const errorsByLang: Record<string, any> = {
  en: enErrors,
  es: esErrors,
  fr: frErrors,
  ja: jaErrors,
  mn: mnErrors,
  pt: ptErrors,
  ru: ruErrors,
}

describe('a tool call never reads another survey than the turn was authorised for (389)', () => {
  test('a different survey id is a surveyChanged failure and the tool does not run', async () => {
    const survey = await buildAssistantSurvey({ surveyId: 7 })
    const other = await buildAssistantSurvey({ surveyId: 8 })
    const execute = jest.spyOn(nodeDefGetTool, 'execute')
    const ctx = createToolContext({ survey, getSurvey: () => other })
    const result: any = await runTool(nodeDefGetTool, { name: 'plot' }, ctx)
    expect(result.error).toMatchObject({ code: 'surveyChanged', messageKey: 'appErrors:aiSurveyChanged' })
    expect(execute).not.toHaveBeenCalled()
    execute.mockRestore()
  })

  test('no survey any more is also a change; the same survey (newer content) is not', async () => {
    const survey = await buildAssistantSurvey({ surveyId: 7 })
    const gone: any = await runTool(
      nodeDefGetTool,
      { name: 'plot' },
      createToolContext({ survey, getSurvey: () => null })
    )
    expect(gone.error.code).toBe('surveyChanged')
    const same: any = await runTool(
      nodeDefGetTool,
      { name: 'plot' },
      createToolContext({ survey, getSurvey: () => survey })
    )
    expect(same.error).toBeUndefined()
  })

  test('the message is translated in the 7 languages', () => {
    for (const [lang, errors] of Object.entries(errorsByLang)) {
      expect(typeof errors.aiSurveyChanged).toBe('string')
      expect(errors.aiSurveyChanged.length).toBeGreaterThan(10)
      expect(lang).toBeDefined()
    }
  })
})

describe('designer-rule conflicts carry an i18n key and its params (389)', () => {
  let survey: any
  beforeAll(async () => {
    survey = await buildRefSurvey()
  })

  const publish = (target: any) =>
    Survey.getNodeDefsArray(target).reduce(
      (acc: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef: { ...nodeDef, published: true } })(acc),
      target
    )

  const propose = async (tool: any, input: object, target: any = survey) => {
    const ctx = createToolContext({ survey: target })
    await runTool(tool, input, ctx)
    return ctx.changeSets[0] as ChangeSet
  }

  test('a structural conflict: reason is the full key, params the interpolation values', async () => {
    const changeSet = await propose(nodeDefProposeUpdateTool, {
      summary: 'Assign the list',
      changes: [{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }],
    })
    const [conflict] = findStructuralConflicts({ changeSet, survey: publish(survey) })
    expect(conflict).toEqual({
      id: changeSet.operations[0].id,
      reason: 'aiAssistant.issues.refEditDisabled',
      params: { name: 'region' },
    })
    expect(isI18nKeyReason(conflict.reason)).toBe(true)
    for (const plain of ['valueChanged', 'nodeDefMissing', 'surveyDirty', 'nameTaken']) {
      expect(isI18nKeyReason(plain)).toBe(false)
    }
  })

  test('every aiAssistant.issues key and the new keys exist in the 7 languages', () => {
    const keys = Object.keys(en.aiAssistant.issues)
    expect(keys).toEqual(expect.arrayContaining(['refEditDisabled', 'nodeDefInvalid', 'expressionInvalid']))
    for (const [lang, common] of Object.entries(commonByLang)) {
      for (const key of keys) {
        expect([lang, key, typeof common.aiAssistant.issues[key]]).toEqual([lang, key, 'string'])
      }
    }
  })

  test('a node definition invalid for several reasons is held back with all of them listed', async () => {
    const changeSet = await propose(expressionsProposeSetTool, {
      summary: 'Defaults',
      nodeDefName: 'country',
      prop: 'defaultValues',
      expressions: [{ expression: 'region' }],
    })
    const withoutRegion = Survey.dissocNodeDef(NodeDef.getUuid(getDefByName(survey, 'region')))(survey)
    const conflicts = await findValidationConflicts({
      changeSet,
      survey: withoutRegion,
      operationIds: changeSet.operations.map((op) => op.id),
    })
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].reason).toBe('aiAssistant.issues.nodeDefInvalid')
    expect(conflicts[0].params).toMatchObject({ name: 'country' })
    const issues = conflicts[0].params!.issues as { key: string }[]
    expect(conflicts[0].params!.count).toBe(issues.length)
    // the node def default values are invalid and the expression itself names the missing attribute
    expect(issues.length).toBeGreaterThan(1)
    expect(issues.map((issue) => issue.key)).toEqual(
      expect.arrayContaining(['validationErrors:nodeDefEdit.defaultValuesInvalid', 'expression.identifierNotFound'])
    )
  })

  test('the reason says that the whole node definition is held back', () => {
    expect(en.aiAssistant.issues.nodeDefInvalid).toMatch(/none of its changes|all its changes/i)
  })
})

describe('Apply does not count on a create it will not apply (389)', () => {
  let survey: any
  beforeAll(async () => {
    survey = await buildRefSurvey()
  })

  const fakeDeps = (start: any) => {
    let current = start
    const posts: any[] = []
    const puts: any[] = []
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
    return { deps, posts, puts }
  }

  // creates plot_size and sets country's relevant-if expression to use it
  const buildMixedChangeSet = async (): Promise<ChangeSet> => {
    const createCtx = createToolContext({ survey })
    await runTool(
      nodeDefProposeCreateTool,
      { summary: 'Add size', nodeDefs: [{ parentName: 'cluster', type: 'integer', name: 'plot_size' }] },
      createCtx
    )
    const create = createCtx.changeSets[0]
    const applied = fakeDeps(survey)
    await applyChangeSet({
      changeSet: create,
      operationIds: create.operations.map((op) => op.id),
      deps: applied.deps,
    })
    const exprCtx = createToolContext({ survey: applied.deps.getSurvey() })
    await runTool(
      expressionsProposeSetTool,
      {
        summary: 'Relevant',
        nodeDefName: 'country',
        prop: 'applicable',
        expressions: [{ expression: 'plot_size > 0' }],
      },
      exprCtx
    )
    return { ...exprCtx.changeSets[0], operations: [...create.operations, ...exprCtx.changeSets[0].operations] }
  }

  test('an expression that uses a create left out of the selection is held back', async () => {
    const changeSet = await buildMixedChangeSet()
    const expressionOp = changeSet.operations.at(-1)!
    const { deps, posts, puts } = fakeDeps(survey)
    const results = await applyChangeSet({ changeSet, operationIds: [expressionOp.id], deps })
    expect(results).toHaveLength(1)
    expect(results[0].status).toBe('conflict')
    expect(posts).toEqual([])
    expect(puts).toEqual([])
  })

  test('with the create selected too, both are applied', async () => {
    const changeSet = await buildMixedChangeSet()
    const { deps, posts } = fakeDeps(survey)
    const results = await applyChangeSet({ changeSet, operationIds: changeSet.operations.map((op) => op.id), deps })
    expect(results.map((result) => result.status)).toEqual(['applied', 'applied'])
    expect(posts).toHaveLength(1)
  })
})

describe('the batch props route refuses a category change on a published attribute (389)', () => {
  // the guard runs before any query: a client that only opens the transaction is enough
  const fakeClient: any = { tx: async (fn: (t: unknown) => unknown) => fn({}) }
  let survey: any
  let published: any
  beforeAll(async () => {
    survey = await buildRefSurvey()
    published = Survey.getNodeDefsArray(survey).reduce(
      (acc: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef: { ...nodeDef, published: true } })(acc),
      survey
    )
  })

  test('the service throws the same 409 as the single update', async () => {
    const { updateNodeDefsProps } = await import('@server/modules/nodeDef/service/nodeDefService')
    const country = NodeDef.getUuid(getDefByName(published, 'country'))
    await expect(
      updateNodeDefsProps(
        {
          surveyId: 1,
          cycle: '0',
          survey: published,
          nodeDefs: [{ nodeDefUuid: country, props: { categoryUuid: 'x' } }],
        },
        fakeClient
      )
    ).rejects.toMatchObject({
      key: 'appErrors:survey.nodeDefRefLocked',
      params: { name: 'country', prop: 'categoryUuid' },
      statusCode: 409,
    })
  })

  test('the guard passes other props, the same value and an unpublished attribute', async () => {
    const { assertNodeDefsRefPropsCanChange } = await import('@server/modules/nodeDef/manager/nodeDefManager')
    const country = getDefByName(published, 'country')
    const uuid = NodeDef.getUuid(country)
    expect(() =>
      assertNodeDefsRefPropsCanChange({
        survey: published,
        nodeDefs: [
          { nodeDefUuid: uuid, props: { layout: {} } },
          { nodeDefUuid: uuid, props: { categoryUuid: NodeDef.getCategoryUuid(country) } },
        ],
      })
    ).not.toThrow()
    expect(() =>
      assertNodeDefsRefPropsCanChange({
        survey,
        nodeDefs: [{ nodeDefUuid: uuid, props: { categoryUuid: 'another-category' } }],
      })
    ).not.toThrow()
  })
})
