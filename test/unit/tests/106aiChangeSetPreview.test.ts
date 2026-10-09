import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import { previewChangeSet } from '@webapp/ai/changeSets/previewChangeSet'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import { buildAssistantSurvey, fakeT, getDefByName } from '@test/unit/utils/assistantTestUtils'

let survey: any
let counter = 0

beforeAll(async () => {
  survey = await buildAssistantSurvey()
})

const build = (drafts: ChangeOperationDraft[]) =>
  buildChangeSet({
    drafts,
    survey,
    summary: 'test',
    now: () => new Date('2026-10-06T10:00:00.000Z'),
    idFactory: () => {
      counter += 1
      return `id-${counter}`
    },
  })

const preview = (drafts: ChangeOperationDraft[]) => previewChangeSet(build(drafts), survey, { t: fakeT })

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

const createDraft = (params: { parentName: string; type: string; name: string; labels?: Record<string, string> }) => {
  const parent = getDefByName(survey, params.parentName)
  const nodeDef = createProposedNodeDef({ parent, cycle: '0', ...params })
  return { type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(parent) } as ChangeOperationDraft
}

const labelDraft = (name: string, lang: string, to: string): ChangeOperationDraft => ({
  type: 'label.set',
  nodeDefUuid: uuidOf(name),
  kind: 'labels',
  lang,
  from: NodeDef.getLabels(getDefByName(survey, name))[lang] ?? null,
  to,
})

const expressionDraft = (name: string, prop: any, expressions: string[]): ChangeOperationDraft => ({
  type: 'expression.set',
  nodeDefUuid: uuidOf(name),
  prop,
  from: [],
  to: expressions.map((expression) => NodeDefExpression.createExpression({ expression })),
})

const messages = (result: any) => result.validation.issues.map((issue: any) => issue.message)

describe('buildChangeSet', () => {
  test('gives ids to the change set and its operations', () => {
    counter = 0
    const changeSet = build([labelDraft('cluster_id', 'en', 'Cluster identifier')])
    expect(changeSet).toEqual({
      id: 'id-1',
      surveyId: 7,
      summary: 'test',
      createdAt: '2026-10-06T10:00:00.000Z',
      operations: [expect.objectContaining({ id: 'id-2', type: 'label.set', to: 'Cluster identifier' })],
    })
  })
})

describe('previewChangeSet', () => {
  test('a valid label proposal: applied on a copy, the survey is untouched', async () => {
    const result = await preview([labelDraft('cluster_id', 'en', 'Cluster identifier')])
    expect(result.validation).toEqual({ valid: true, issues: [] })
    expect(NodeDef.getLabels(Survey.getNodeDefByUuid(uuidOf('cluster_id'))(result.survey)).en).toBe(
      'Cluster identifier'
    )
    expect(NodeDef.getLabels(getDefByName(survey, 'cluster_id')).en).toBe('Cluster id')
  })

  test('a new attribute is valid and gets the final uuid', async () => {
    const draft: any = createDraft({
      parentName: 'cluster',
      type: 'text',
      name: 'cluster_remarks',
      labels: { en: 'Remarks' },
    })
    const result = await preview([draft])
    expect(result.validation.valid).toBe(true)
    const created = Survey.getNodeDefByUuid(NodeDef.getUuid(draft.nodeDef))(result.survey)
    expect(NodeDef.getName(created)).toBe('cluster_remarks')
    expect(NodeDef.isTemporary(created)).toBe(false)
    expect(NodeDef.getCycles(created)).toEqual(['0'])
  })

  test('a new entity without children is accepted, and a child can refer to it', async () => {
    const entityDraft: any = createDraft({ parentName: 'cluster', type: 'entity', name: 'site' })
    const child = createProposedNodeDef({ parent: entityDraft.nodeDef, type: 'text', cycle: '0', name: 'site_name' })
    expect((await preview([entityDraft])).validation.valid).toBe(true)
    const withChild = await preview([
      entityDraft,
      { type: 'nodeDef.create', nodeDef: child, parentUuid: NodeDef.getUuid(entityDraft.nodeDef) },
    ])
    expect(withChild.validation.valid).toBe(true)
    expect(NodeDef.isMultiple(entityDraft.nodeDef)).toBe(true)
  })

  test('a duplicate name is refused with the validator message', async () => {
    const result = await preview([createDraft({ parentName: 'cluster', type: 'text', name: 'plot_id' })])
    expect(result.validation.valid).toBe(false)
    expect(result.validation.issues[0]).toMatchObject({ operation: 0, field: 'name' })
    expect(messages(result)).toContain('validationErrors:nameDuplicate')
  })

  test('a keyword or an invalid name is refused', async () => {
    const keyword = await preview([
      { type: 'nodeDef.update', nodeDefUuid: uuidOf('cluster_notes'), prop: 'name', from: 'cluster_notes', to: 'uuid' },
    ])
    expect(messages(keyword).join()).toMatch(/validationErrors:nameCannotBeKeyword/)
    const badName = await preview([
      {
        type: 'nodeDef.update',
        nodeDefUuid: uuidOf('cluster_notes'),
        prop: 'name',
        from: 'cluster_notes',
        to: 'Bad Name',
      },
    ])
    expect(messages(badName).join()).toMatch(/validationErrors:nodeDefEdit\.nameInvalid/)
  })

  test('a bad expression is refused', async () => {
    const result = await preview([expressionDraft('cluster_notes', 'defaultValues', ['unknown_attr'])])
    expect(result.validation.valid).toBe(false)
    expect(messages(result).join()).toMatch(/validationErrors:/)
  })

  test('visibleIf expressions are checked too', async () => {
    const result = await preview([expressionDraft('cluster_notes', 'visibleIf', ['unknown_attr = 1'])])
    expect(result.validation.valid).toBe(false)
  })

  test('structural issues', async () => {
    const fr = await preview([labelDraft('cluster_id', 'fr', 'Identifiant')])
    expect(messages(fr)).toEqual(['aiAssistant.issues.languageNotInSurvey {"lang":"fr"}'])

    const twoApplicable = await preview([
      expressionDraft('cluster_notes', 'applicable', ['cluster_id > 1', 'cluster_id > 2']),
    ])
    expect(messages(twoApplicable)).toEqual(['aiAssistant.issues.singleExpressionOnly'])

    const empty = await preview([expressionDraft('cluster_notes', 'defaultValues', ['  '])])
    expect(messages(empty)).toEqual(['aiAssistant.issues.expressionEmpty'])

    const underTable = await preview([createDraft({ parentName: 'tree', type: 'entity', name: 'branch' })])
    expect(messages(underTable)).toEqual(['aiAssistant.issues.entityUnderTable {"name":"tree"}'])

    const underAttribute = await preview([createDraft({ parentName: 'cluster_id', type: 'text', name: 'x_text' })])
    expect(messages(underAttribute)).toEqual(['aiAssistant.issues.parentNotEntity {"name":"cluster_id"}'])

    const code = await preview([createDraft({ parentName: 'cluster', type: 'code', name: 'x_code' })])
    expect(messages(code)).toEqual(['aiAssistant.issues.typeNotAllowed {"type":"code"}'])
  })

  test('entity multiple, root entity and duplicate operations are refused', async () => {
    const multiple = await preview([
      { type: 'nodeDef.update', nodeDefUuid: uuidOf('plot'), prop: 'multiple', from: true, to: false },
    ])
    expect(messages(multiple)).toEqual(['aiAssistant.issues.entityMultipleChange'])

    const root = await preview([
      { type: 'nodeDef.update', nodeDefUuid: uuidOf('cluster'), prop: 'name', from: 'cluster', to: 'cluster_x' },
    ])
    expect(messages(root)).toEqual(['aiAssistant.issues.rootEntity'])

    const twice = await preview([labelDraft('cluster_id', 'en', 'A'), labelDraft('cluster_id', 'en', 'B')])
    expect(twice.validation.issues).toEqual([
      { operation: 1, field: 'labels.en', message: 'aiAssistant.issues.duplicateOperation {"name":"cluster_id"}' },
    ])
  })

  describe('the designer guards on multiple and key', () => {
    const update = (name: string, prop: 'multiple' | 'key', to: boolean, target = survey): ChangeOperationDraft => ({
      type: 'nodeDef.update',
      nodeDefUuid: NodeDef.getUuid(getDefByName(target, name)),
      prop,
      from: !to,
      to,
    })
    const publish = (name: string) => {
      const nodeDef = getDefByName(survey, name)
      const uuid = NodeDef.getUuid(nodeDef)
      return { ...survey, nodeDefs: { ...survey.nodeDefs, [uuid]: { ...nodeDef, published: true } } }
    }

    test('multiple on a published attribute is refused, on a draft one it is accepted', async () => {
      const published = publish('cluster_notes')
      const refused = await previewChangeSet(build([update('cluster_notes', 'multiple', true, published)]), published, {
        t: fakeT,
      })
      expect(messages(refused)).toEqual(['aiAssistant.issues.multipleEditDisabled {"name":"cluster_notes"}'])
      expect((await preview([update('cluster_notes', 'multiple', true)])).validation.valid).toBe(true)
    })

    test('multiple on a key attribute or on a type that cannot be multiple is refused', async () => {
      const key = await preview([update('cluster_id', 'multiple', true)])
      expect(messages(key)).toEqual(['aiAssistant.issues.multipleEditDisabled {"name":"cluster_id"}'])
      const boolean = createDraft({ parentName: 'cluster', type: 'boolean', name: 'flag' })
      const withBoolean = await preview([boolean])
      const flagUuid = NodeDef.getUuid((boolean as any).nodeDef)
      const toMultiple: ChangeOperationDraft = {
        type: 'nodeDef.update',
        nodeDefUuid: flagUuid,
        prop: 'multiple',
        from: false,
        to: true,
      }
      const changeSet = build([boolean, toMultiple])
      const result = await previewChangeSet(changeSet, survey, { t: fakeT })
      expect(withBoolean.validation.valid).toBe(true)
      expect(messages(result)).toEqual(['aiAssistant.issues.multipleNotAllowed {"name":"flag"}'])
    })

    test('a new boolean cannot be created multiple', async () => {
      const parent = getDefByName(survey, 'cluster')
      const nodeDef = createProposedNodeDef({ parent, cycle: '0', type: 'boolean', name: 'flag', multiple: true })
      const result = await preview([
        { type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(parent) } as ChangeOperationDraft,
      ])
      expect(messages(result)).toEqual(['aiAssistant.issues.multipleNotAllowed {"name":"flag"}'])
    })

    test('key on a multiple attribute, on an entity or on a boolean is refused', async () => {
      const multipleText = await preview([
        update('cluster_notes', 'multiple', true),
        update('cluster_notes', 'key', true),
      ])
      expect(messages(multipleText)).toEqual(['aiAssistant.issues.keyEditDisabled {"name":"cluster_notes"}'])

      const entity = await preview([update('plot', 'key', true)])
      expect(messages(entity)).toEqual(['aiAssistant.issues.keyNotAllowed {"name":"plot"}'])

      const parent = getDefByName(survey, 'cluster')
      const newKey = (type: string, multiple = false) =>
        ({
          type: 'nodeDef.create',
          nodeDef: createProposedNodeDef({ parent, cycle: '0', type, name: 'k_new', key: true, multiple }),
          parentUuid: NodeDef.getUuid(parent),
        }) as ChangeOperationDraft
      expect(messages(await preview([newKey('boolean')]))).toEqual([
        'aiAssistant.issues.keyNotAllowed {"name":"k_new"}',
      ])
      expect(messages(await preview([newKey('text', true)]))).toEqual([
        'aiAssistant.issues.keyEditDisabled {"name":"k_new"}',
      ])
      expect((await preview([newKey('text')])).validation.valid).toBe(true)
    })
  })

  test('labels and descriptions of a new node definition in a language not in the survey are refused', async () => {
    const parent = getDefByName(survey, 'cluster')
    const nodeDef = createProposedNodeDef({
      parent,
      cycle: '0',
      type: 'text',
      name: 'cluster_remarks',
      labels: { en: 'Remarks', fr: 'Remarques' },
      descriptions: { de: 'Hinweis' },
    })
    const result = await preview([
      { type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(parent) } as ChangeOperationDraft,
    ])
    expect(result.validation.issues).toEqual([
      { operation: 0, field: 'labels.fr', message: 'aiAssistant.issues.languageNotInSurvey {"lang":"fr"}' },
      { operation: 0, field: 'descriptions.de', message: 'aiAssistant.issues.languageNotInSurvey {"lang":"de"}' },
    ])
  })

  test('creates with a mismatched parent or a repeated uuid are refused', async () => {
    const draft: any = createDraft({ parentName: 'cluster', type: 'text', name: 'cluster_remarks' })
    const wrongParent = await preview([{ ...draft, parentUuid: uuidOf('plot') }])
    expect(wrongParent.validation.valid).toBe(false)
    expect(wrongParent.validation.issues[0]).toMatchObject({ operation: 0, field: 'parentUuid' })

    const twice = await preview([draft, draft])
    expect(twice.validation.valid).toBe(false)
    expect(twice.validation.issues[0]).toMatchObject({ operation: 1, field: 'nodeDef' })

    const existing = await preview([{ ...draft, nodeDef: getDefByName(survey, 'plot_id') }])
    expect(existing.validation.issues[0]).toMatchObject({ operation: 0, field: 'nodeDef' })
  })

  test('previewing a create leaves the input survey untouched', async () => {
    const before = JSON.stringify([survey.nodeDefs, survey.nodeDefsIndex])
    const draft: any = createDraft({ parentName: 'cluster', type: 'text', name: 'cluster_remarks' })
    await preview([draft])
    expect(JSON.stringify([survey.nodeDefs, survey.nodeDefsIndex])).toBe(before)
  })

  test('a root label can be translated', async () => {
    expect((await preview([labelDraft('cluster', 'en', 'Cluster plot')])).validation.valid).toBe(true)
  })
})
