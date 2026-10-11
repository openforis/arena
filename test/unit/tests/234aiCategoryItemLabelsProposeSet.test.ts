import { CATEGORY_ITEM_LABEL_TEXT_MAX } from '@common/ai/categoryItemLabels'
import { buildAssistantDesignPrompt } from '@common/ai/prompts/assistantDesign'

import { createCategoryItemRefs, type CategoryItemRefs } from '@webapp/ai/tools/design/categoryItemRefs'
import { categoryItemLabelsProposeSetTool } from '@webapp/ai/tools/design/categoryItemLabelsProposeSet'
import { getTools, runTool } from '@webapp/ai/tools/registry'
import type { AiToolContext } from '@webapp/ai/tools/types'

import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { buildCategoryLabelsSurvey, categoryUuidOf } from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any
let speciesUuid: string
let refs: CategoryItemRefs

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
})

beforeEach(() => {
  refs = createCategoryItemRefs()
  refs.register({
    surveyId: 7,
    categoryUuid: speciesUuid,
    ref: '1',
    entry: { itemUuid: 'item-1', levelName: 'genus', labels: { en: 'Pinus' } },
  })
  refs.register({
    surveyId: 7,
    categoryUuid: speciesUuid,
    ref: '1.2',
    entry: { itemUuid: 'item-1.2', levelName: 'species', labels: { en: 'Pinus nigra', fr: ' ' } },
  })
})

/**
 * Runs the tool with the registered refs.
 * @param {object[]} items - Proposed items.
 * @param {object} [overrides] - Tool context overrides.
 * @returns {Promise<object>} The result and the context.
 */
const propose = async (items: Record<string, unknown>[], overrides: Partial<AiToolContext> = {}) => {
  const ctx = createToolContext({ survey, categoryItemRefs: refs, ...overrides })
  const result: any = await runTool(categoryItemLabelsProposeSetTool, { summary: 'Translate species', items }, ctx)
  return { result, ctx }
}

describe('categoryItemLabels_proposeSet (234)', () => {
  test('proposes the listed items as one card, with the label read at listing time as expected text', async () => {
    const { result, ctx } = await propose([
      { categoryName: 'species', ref: '1', lang: 'fr', text: 'Pin' },
      { categoryName: 'species', ref: '1.2', lang: 'fr', text: 'Pin noir' },
    ])
    expect(result).toMatchObject({ operations: 2, status: 'shownToUser' })
    expect(ctx.changeSets).toHaveLength(1)
    expect(ctx.changeSets[0].operations).toMatchObject([
      {
        type: 'categoryItemLabel.set',
        categoryUuid: speciesUuid,
        itemUuid: 'item-1',
        ref: '1',
        levelName: 'genus',
        lang: 'fr',
        text: 'Pin',
        expectedText: null,
      },
      { itemUuid: 'item-1.2', ref: '1.2', levelName: 'species', text: 'Pin noir', expectedText: ' ' },
    ])
  })

  test('refuses a ref that was not listed, an unknown category, and a category outside the accepted suggestion', async () => {
    const notListed = await propose([{ categoryName: 'species', ref: '9', lang: 'fr', text: 'Neuf' }])
    expect(notListed.result.error).toMatchObject({ code: 'itemNotListed', ref: '9' })
    expect(notListed.result.error.message).toContain('categoryItems_listMissingLabels')
    expect(notListed.ctx.changeSets).toHaveLength(0)

    const unknown = await propose([{ categoryName: 'nope', ref: '1', lang: 'fr', text: 'Pin' }])
    expect(unknown.result.error.code).toBe('categoryNotFound')

    const landUseUuid = categoryUuidOf(survey, 'land_use')
    const outOfScope = await propose([{ categoryName: 'species', ref: '1', lang: 'fr', text: 'Pin' }], {
      suggestionScope: { kind: 'categoryItemTranslations', targetKeys: [landUseUuid] },
    })
    expect(outOfScope.result.error.code).toBe('categoryOutOfScope')
  })

  test('a language outside the survey and a repeated label are invalid proposals; an unchanged one is no change', async () => {
    const foreign = await propose([{ categoryName: 'species', ref: '1', lang: 'de', text: 'Kiefer' }])
    expect(foreign.result.error.code).toBe('invalidProposal')
    expect(foreign.result.error.issues).toEqual([expect.objectContaining({ operation: 0, field: 'labels.de' })])

    const repeated = await propose([
      { categoryName: 'species', ref: '1', lang: 'fr', text: 'Pin' },
      { categoryName: 'species', ref: '1', lang: 'fr', text: 'Pin sylvestre' },
    ])
    expect(repeated.result.error.code).toBe('invalidProposal')

    const unchanged = await propose([{ categoryName: 'species', ref: '1', lang: 'en', text: 'Pinus' }])
    expect(unchanged.result.error.code).toBe('noChange')
  })

  test('both category tools are Design tools for editors, and the Design prompt names them', () => {
    const effective = { schema: 'cloud', data: 'off' } as any
    const names = (ctx: AiToolContext) =>
      getTools({ area: 'design', ctx, effective, hostingClass: 'cloud' }).map((tool) => tool.name)
    expect(names(createToolContext({ survey }))).toEqual(
      expect.arrayContaining(['categoryItems_listMissingLabels', 'categoryItemLabels_proposeSet'])
    )
    expect(names(createToolContext({ survey, canEditSurvey: false }))).not.toContain('categoryItems_listMissingLabels')
    expect(names(createToolContext({ survey, canEditSurvey: false }))).not.toContain('categoryItemLabels_proposeSet')

    const prompt = buildAssistantDesignPrompt({
      uiLang: 'en',
      surveyName: 'forest_inv',
      surveyLabel: 'Forest inventory',
      languages: ['en', 'fr'],
      cycle: '0',
      viewDescription: null,
    })
    expect(prompt).toContain('categoryItems_listMissingLabels')
    expect(prompt).toContain('categoryItemLabels_proposeSet')
  })

  test('refuses a blank text and a text over the maximum before proposing anything', async () => {
    const blank = await propose([{ categoryName: 'species', ref: '1', lang: 'fr', text: '   ' }])
    expect(blank.result.error.code).toBe('invalidInput')
    const tooLong = await propose([
      { categoryName: 'species', ref: '1', lang: 'fr', text: 'x'.repeat(CATEGORY_ITEM_LABEL_TEXT_MAX + 1) },
    ])
    expect(tooLong.result.error.code).toBe('invalidInput')
    expect(blank.ctx.changeSets).toHaveLength(0)
    expect(tooLong.ctx.changeSets).toHaveLength(0)
  })

  test('looks the ref up trimmed', async () => {
    const { result } = await propose([{ categoryName: 'species', ref: ' 1 ', lang: 'fr', text: 'Pin' }])
    expect(result).toMatchObject({ operations: 1, status: 'shownToUser' })
  })
})
