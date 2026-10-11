import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { applyChangeSet } from '@webapp/ai/changeSets/applyChangeSet'
import { getCategoryItemLabelKey, isCategoryItemLabelOperation } from '@webapp/ai/changeSets/categoryItemLabels/types'
import { describeOperation, summarizeResults } from '@webapp/ai/changeSets/describeOperation'
import { findConflicts } from '@webapp/ai/changeSets/findConflicts'
import { previewChangeSet } from '@webapp/ai/changeSets/previewChangeSet'
import { proposeChangeSet } from '@webapp/ai/tools/design/proposeChangeSet'
import { buildCardRows, getPendingOperationIds } from '@webapp/components/ai/Assistant/changeSetCardModel'
import { createToolContext, fakeT, getDefByName } from '@test/unit/utils/assistantTestUtils'
import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelDraft,
  categoryLabelOp,
  categoryUuidOf,
  createApplierDepsStub,
} from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any
let speciesUuid: string

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
})

const op = (overrides: Record<string, unknown> = {}) =>
  categoryLabelOp({ categoryUuid: speciesUuid, ref: '1.2', ...overrides })

describe('category item label operations in the change set paths (230)', () => {
  test('the type guard and the label key', () => {
    expect(isCategoryItemLabelOperation(op())).toBe(true)
    expect(isCategoryItemLabelOperation({ type: 'label.set' })).toBe(false)
    expect(getCategoryItemLabelKey({ itemUuid: 'i1', lang: 'fr' })).toBe('i1|fr')
    // the server answers lower-cased uuids
    expect(getCategoryItemLabelKey({ itemUuid: 'I1', lang: 'fr' })).toBe('i1|fr')
  })

  test('preview: valid category operations leave the survey as it is', async () => {
    const changeSet = categoryLabelChangeSet([op(), op({ id: 'c2', lang: 'es' })])
    const preview = await previewChangeSet(changeSet, survey, { t: fakeT })
    expect(preview.validation).toEqual({ valid: true, issues: [] })
    expect(preview.survey).toBe(survey)
  })

  test('preview: an unknown category, a foreign language or a repeated item label is an issue', async () => {
    const changeSet = categoryLabelChangeSet([
      op({ id: 'c1', categoryUuid: 'gone' }),
      op({ id: 'c2', lang: 'de' }),
      op({ id: 'c3' }),
      op({ id: 'c4', text: 'Acacia (bis)' }),
    ])
    const { validation } = await previewChangeSet(changeSet, survey, { t: fakeT })
    expect(validation.valid).toBe(false)
    expect(validation.issues).toEqual([
      { operation: 0, field: 'categoryUuid', message: 'aiAssistant.issues.categoryNotFound {"name":"gone"}' },
      { operation: 1, field: 'labels.de', message: 'aiAssistant.issues.languageNotInSurvey {"lang":"de"}' },
      { operation: 3, field: 'labels.fr', message: 'aiAssistant.issues.duplicateOperation {"name":"1.2"}' },
    ])
  })

  test('preview: node definition operations of the same change set are previewed as before', async () => {
    const clusterIdUuid = NodeDef.getUuid(getDefByName(survey, 'cluster_id'))
    const changeSet = categoryLabelChangeSet([
      op(),
      {
        id: 'l1',
        type: 'label.set',
        nodeDefUuid: clusterIdUuid,
        kind: 'labels',
        lang: 'fr',
        from: null,
        to: 'Identifiant',
      },
    ])
    const preview = await previewChangeSet(changeSet, survey, { t: fakeT })
    expect(preview.validation.valid).toBe(true)
    expect(NodeDef.getLabels(Survey.getNodeDefByUuid(clusterIdUuid)(preview.survey)).fr).toBe('Identifiant')
  })

  test('conflicts: category operations are left to the server', () => {
    expect(findConflicts(categoryLabelChangeSet([op({ categoryUuid: 'gone' })]), survey)).toEqual([])
  })

  test('card rows: category operations are not node definition rows, but they are pending', () => {
    const changeSet = categoryLabelChangeSet([op()])
    expect(buildCardRows({ cardState: { changeSet }, survey, lang: 'en' })).toEqual([])
    expect(getPendingOperationIds({ changeSet })).toEqual(['c1'])
  })

  test('describe: the Apply note names the category, the item and the language', () => {
    const changeSet = categoryLabelChangeSet([op(), op({ id: 'c2', ref: '2.1' })])
    expect(describeOperation(changeSet.operations[0], { changeSet, survey })).toBe(
      'category `species` item 1.2 label (fr)'
    )
    const note = summarizeResults({
      changeSet,
      survey,
      results: [
        { id: 'c1', status: 'applied' },
        { id: 'c2', status: 'conflict', message: 'valueChanged' },
      ],
    })
    expect(note).toBe('Applied 1 of 2 operations; category `species` item 2.1 label (fr): conflict (valueChanged).')
  })

  test('propose: a label that already has the proposed text changes nothing', async () => {
    const ctx = createToolContext({ survey })
    const same = categoryLabelDraft({ categoryUuid: speciesUuid, ref: '1', text: 'Acacia', expectedText: 'Acacia' })
    await expect(proposeChangeSet({ ctx, drafts: [same], summary: 'Labels' })).rejects.toMatchObject({
      code: 'noChange',
    })
    const draft = categoryLabelDraft({ categoryUuid: speciesUuid, ref: '1.2' })
    expect(await proposeChangeSet({ ctx, drafts: [draft], summary: 'Labels' })).toMatchObject({
      operations: 1,
      status: 'shownToUser',
    })
    expect(ctx.changeSets[0].operations[0]).toMatchObject({ type: 'categoryItemLabel.set', ref: '1.2', lang: 'fr' })
  })

  test('apply without category dependencies: skipped as not supported, or as dirty', async () => {
    const changeSet = categoryLabelChangeSet([op()])
    expect(await applyChangeSet({ changeSet, operationIds: ['c1'], deps: createApplierDepsStub(survey) })).toEqual([
      { id: 'c1', status: 'skipped', message: 'notSupported' },
    ])
    const dirtyDeps = createApplierDepsStub(survey, { isSurveyDirty: () => true })
    expect(await applyChangeSet({ changeSet, operationIds: ['c1'], deps: dirtyDeps })).toEqual([
      { id: 'c1', status: 'skipped', message: 'surveyDirty' },
    ])
  })
})
