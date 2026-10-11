import { AiLimits } from '@common/ai/limits'

import { createCategoryItemRefs } from '@webapp/ai/tools/design/categoryItemRefs'
import {
  categoryItemsListMissingLabelsTool,
  createCategoryItemsListMissingLabelsTool,
} from '@webapp/ai/tools/design/categoryItemsListMissingLabels'
import { runTool } from '@webapp/ai/tools/registry'
import type { AiToolContext } from '@webapp/ai/tools/types'
import type { ChangeSet } from '@webapp/ai/changeSets/types'

import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import {
  buildCategoryLabelsSurvey,
  categoryLabelChangeSet,
  categoryLabelOp,
  categoryUuidOf,
  createFakeMissingLabelsServer,
  fakeCategoryItem,
  type FakeCategoryItem,
} from '@test/unit/utils/categoryLabelsTestUtils'

let survey: any
let speciesUuid: string

beforeAll(async () => {
  survey = await buildCategoryLabelsSurvey()
  speciesUuid = categoryUuidOf(survey, 'species')
})

/**
 * Builds items 1..count (genus level), labelled in en only.
 * @param {number} count - Number of items.
 * @param {object} [labels] - Labels of every item (default: `{ en: "Item <ref>" }`).
 * @returns {FakeCategoryItem[]} The items.
 */
const genusItems = (count: number, labels?: Record<string, string>): FakeCategoryItem[] =>
  Array.from({ length: count }, (_, index) => fakeCategoryItem(String(index + 1), labels))

/**
 * Sets up the tool on a fake server holding the species items.
 * @param {object} params - Parameters.
 * @param {FakeCategoryItem[]} params.items - Species items.
 * @param {ChangeSet[]} [params.pending] - Pending change sets.
 * @param {object} [params.overrides] - Tool context overrides.
 * @returns {object} `{ server, ctx, list }`.
 */
const setup = ({
  items,
  pending = [],
  overrides = {},
}: {
  items: FakeCategoryItem[]
  pending?: ChangeSet[]
  overrides?: Partial<AiToolContext>
}) => {
  const server = createFakeMissingLabelsServer({ itemsByCategory: { [speciesUuid]: items } })
  const tool = createCategoryItemsListMissingLabelsTool({ fetchPage: server.fetchPage })
  const ctx = createToolContext({
    survey,
    categoryItemRefs: createCategoryItemRefs(),
    getPendingChangeSets: () => pending,
    suggestionScope: null,
    ...overrides,
  })
  const list = (input: Record<string, unknown> = {}): Promise<any> =>
    runTool(tool, { categoryName: 'species', lang: 'fr', ...input }, ctx)
  return { server, ctx, list }
}

describe('categoryItems_listMissingLabels (233)', () => {
  test('lists the items missing the label with their source text, and registers their refs', async () => {
    const items = [
      fakeCategoryItem('1'),
      fakeCategoryItem('1.1', { en: 'Pinus', fr: 'Pin' }),
      fakeCategoryItem('2', { en: '', es: 'Abeto' }),
    ]
    const { server, ctx, list } = setup({ items })
    const result = await list()
    expect(result).toMatchObject({
      categoryName: 'species',
      lang: 'fr',
      total: 2,
      nextCursor: null,
      items: [
        { ref: '1', levelName: 'genus', code: '1', sourceLang: 'en', sourceText: 'Item 1' },
        { ref: '2', levelName: 'genus', code: '2', sourceLang: 'es', sourceText: 'Abeto' },
      ],
    })
    expect(result.items[0].sourceTextTruncated).toBeUndefined()
    expect(server.calls[0]).toMatchObject({
      surveyId: 7,
      categoryUuid: speciesUuid,
      lang: 'fr',
      cursor: null,
      limit: 100,
    })
    expect(ctx.categoryItemRefs?.get({ surveyId: 7, categoryUuid: speciesUuid, ref: '2' })).toEqual({
      itemUuid: 'item-2',
      levelName: 'genus',
      labels: { en: '', es: 'Abeto' },
    })
    expect(categoryItemsListMissingLabelsTool).toMatchObject({
      name: 'categoryItems_listMissingLabels',
      effect: 'read',
      dataClass: 'schema',
      area: ['design'],
    })
    expect(categoryItemsListMissingLabelsTool.requires(createToolContext({ survey, canEditSurvey: false }))).toBe(false)
  })

  test('skips pending items, and total drops by them; reads further server pages when they fill one', async () => {
    const pendingOps = Array.from({ length: 100 }, (_, index) =>
      categoryLabelOp({ id: `c${index}`, categoryUuid: speciesUuid, ref: String(index + 1) })
    )
    // a pending label in another language does not hide the item
    const otherLang = categoryLabelOp({ id: 'other-lang', categoryUuid: speciesUuid, ref: '111', lang: 'es' })
    const pending = [categoryLabelChangeSet([...pendingOps, otherLang])]
    const { server, list } = setup({ items: genusItems(130), pending })
    const result = await list({ limit: 11 })
    expect(result.items.map((item: any) => item.ref)).toEqual(
      Array.from({ length: 11 }, (_, index) => String(index + 101))
    )
    expect(result.total).toBe(30)
    expect(result.nextCursor).toBe('item-111')
    expect(server.calls).toHaveLength(2)
    expect(server.calls[1].cursor).toBe('item-100')
  })

  test('the cursor survives an Apply between two calls: the rest, without loss or repetition', async () => {
    const { server, list } = setup({ items: genusItems(6) })
    const first = await list({ limit: 2 })
    expect(first.items.map((item: any) => item.ref)).toEqual(['1', '2'])
    expect(first).toMatchObject({ total: 6, nextCursor: 'item-2' })

    // the user applies the first page: those items leave the server's missing list
    server.fill('item-1', 'fr', 'Un')
    server.fill('item-2', 'fr', 'Deux')

    const second = await list({ limit: 2, cursor: first.nextCursor })
    expect(second.items.map((item: any) => item.ref)).toEqual(['3', '4'])
    expect(second).toMatchObject({ total: 4, nextCursor: 'item-4' })
    const third = await list({ limit: 2, cursor: second.nextCursor })
    expect(third.items.map((item: any) => item.ref)).toEqual(['5', '6'])
    expect(third.nextCursor).toBeNull()
  })

  test('a page stops before the JSON budget; a long source text is cut and flagged, and the next page holds the rest', async () => {
    const { list } = setup({ items: genusItems(8, { en: 'x'.repeat(2500) }) })
    const refs: string[] = []
    let cursor: string | null = null
    let calls = 0
    do {
      const page: any = await list(cursor ? { cursor } : {})
      calls += 1
      expect(JSON.stringify(page).length).toBeLessThanOrEqual(AiLimits.assistantToolResultMaxChars - 500)
      for (const item of page.items) {
        expect(item.sourceText).toHaveLength(2000)
        expect(item.sourceTextTruncated).toBe(true)
        refs.push(item.ref)
      }
      cursor = page.nextCursor
    } while (cursor !== null && calls < 10)
    expect(calls).toBeGreaterThan(1)
    expect(refs).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
  })

  test('refuses an unknown category, a foreign language, and a category outside the accepted suggestion', async () => {
    const { list } = setup({ items: genusItems(2) })
    expect((await list({ categoryName: 'nope' })).error.code).toBe('categoryNotFound')
    expect((await list({ lang: 'de' })).error.code).toBe('invalidInput')

    const landUseUuid = categoryUuidOf(survey, 'land_use')
    const outOfScope = setup({
      items: genusItems(2),
      overrides: { suggestionScope: { kind: 'categoryItemTranslations', targetKeys: [landUseUuid] } },
    })
    expect((await outOfScope.list()).error.code).toBe('categoryOutOfScope')

    const inScope = setup({
      items: genusItems(2),
      overrides: { suggestionScope: { kind: 'categoryItemTranslations', targetKeys: [speciesUuid] } },
    })
    expect((await inScope.list()).items).toHaveLength(2)
  })
})
