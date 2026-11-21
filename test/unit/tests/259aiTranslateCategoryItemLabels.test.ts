// test/unit/tests/259aiTranslateCategoryItemLabels.test.ts
import type { MissingLabelsItem } from '@common/ai/categoryItemLabels'

import { applyCategoryItemLabels } from '@webapp/ai/changeSets/categoryItemLabels/applyCategoryItemLabels'
import { CATEGORY_ITEM_LABEL_SET } from '@webapp/ai/changeSets/categoryItemLabels/types'
import type { OperationResult } from '@webapp/ai/changeSets/types'
import {
  buildCategoryLabelRows,
  loadCategoryLabelRows,
  runTranslateCategoryItemLabels,
  toCategoryLabelDrafts,
} from '@webapp/ai/workflows/translateCategoryItemLabels'

const generateText = async () => ''
const noGuard = async () => {}
const languages = ['en', 'fr', 'es']
const species = { uuid: 'cat-species', name: 'species' }
const landUse = { uuid: 'cat-land-use', name: 'land_use' }

const item = (ref: string, labels: Record<string, string>): MissingLabelsItem => ({
  uuid: `item-${ref}`,
  levelIndex: 0,
  levelName: 'genus',
  codePath: ref.split('.'),
  labels,
})

/**
 * Fake translateItems: every item becomes "<lang>:<text>".
 * @param {object} params - The task parameters.
 * @returns {Promise<object>} The translations.
 */
const translateAll = async ({ targetLangs, items }: any) => ({
  translations: items.map(({ id, text }: any) => ({ id, byLang: { [targetLangs[0]]: `${targetLangs[0]}:${text}` } })),
})

describe('category item labels batch (259)', () => {
  test('rows: only items missing the target label with a source, the default language first', () => {
    const { rows, skippedCount } = buildCategoryLabelRows({
      items: [
        item('1', { en: 'Oak', es: 'Roble' }),
        item('2', { en: 'Pine', fr: 'Pin' }),
        item('3', { es: 'Haya' }),
        item('4', {}),
        item('5.1', { en: 'x'.repeat(11) }),
      ],
      category: species,
      lang: 'fr',
      languages,
      maxChars: 10,
    })
    expect(rows).toEqual([
      expect.objectContaining({ itemUuid: 'item-1', ref: '1', source: { lang: 'en', text: 'Oak' } }),
      expect.objectContaining({ itemUuid: 'item-3', categoryName: 'species', source: { lang: 'es', text: 'Haya' } }),
    ])
    expect(skippedCount).toBe(1)
  })

  test('loading follows the cursor of each category and stops at the run limit', async () => {
    const requests: any[] = []
    const fetchPage = async (params: any) => {
      requests.push(params)
      const first = params.cursor === null
      const prefix = params.categoryUuid === species.uuid ? 's' : 'l'
      return {
        total: 4,
        items: [item(`${prefix}${first ? 1 : 3}`, { en: 'A' }), item(`${prefix}${first ? 2 : 4}`, { en: 'B' })],
        nextCursor: first ? 'cursor-2' : null,
      }
    }
    const params = { surveyId: 7, categories: [species, landUse], lang: 'fr', languages, fetchPage }
    const all = await loadCategoryLabelRows(params)
    expect(all.rows.map((row) => row.ref)).toEqual(['s1', 's2', 's3', 's4', 'l1', 'l2', 'l3', 'l4'])
    expect(requests.map(({ categoryUuid, cursor }) => [categoryUuid, cursor])).toEqual([
      [species.uuid, null],
      [species.uuid, 'cursor-2'],
      [landUse.uuid, null],
      [landUse.uuid, 'cursor-2'],
    ])
    expect(requests[0]).toMatchObject({ surveyId: 7, lang: 'fr', limit: 200 })

    requests.length = 0
    const capped = await loadCategoryLabelRows({ ...params, maxItems: 3 })
    expect(capped.rows).toHaveLength(3)
    expect(requests).toHaveLength(2)
  })

  test('the run sends the rows by source language and counts what the AI did not produce', async () => {
    const { rows } = buildCategoryLabelRows({
      items: [item('1', { en: 'Oak' }), item('2', { es: 'Haya' }), item('3', { en: 'Pine' }), item('4', { en: 'Fir' })],
      category: species,
      lang: 'fr',
      languages,
    })
    const calls: any[] = []
    const translate = async (params: any) => {
      calls.push({ sourceLang: params.sourceLang, targetLangs: params.targetLangs, items: params.items })
      const { translations } = await translateAll(params)
      // the model drops Fir and invents an id
      return {
        translations: [
          ...translations.filter(({ id }: any) => id !== 'item-4'),
          { id: 'made-up', byLang: { fr: 'x' } },
        ],
      }
    }
    const result = await runTranslateCategoryItemLabels({
      rows,
      lang: 'fr',
      skippedCount: 2,
      generateText,
      guard: noGuard,
      translate,
      batchSize: 2,
    })
    expect(calls.map((call) => [call.sourceLang, call.items.map(({ id }: any) => id)])).toEqual([
      ['en', ['item-1', 'item-3']],
      ['en', ['item-4']],
      ['es', ['item-2']],
    ])
    expect(calls[0].targetLangs).toEqual(['fr'])
    expect(calls[0].items[0]).toEqual({ id: 'item-1', text: 'Oak', kind: 'categoryItemLabel' })
    expect(result.rows.map(({ ref, aiText }) => [ref, aiText])).toEqual([
      ['1', 'fr:Oak'],
      ['2', 'fr:Haya'],
      ['3', 'fr:Pine'],
    ])
    // Fir, and the two items never sent
    expect(result.failedCount).toBe(3)
    expect(result.stop).toBeUndefined()

    expect(toCategoryLabelDrafts(result.rows, 'fr')[0]).toEqual({
      type: CATEGORY_ITEM_LABEL_SET,
      categoryUuid: species.uuid,
      itemUuid: 'item-1',
      ref: '1',
      levelName: 'genus',
      lang: 'fr',
      text: 'fr:Oak',
      // proposed over a missing label: one added meanwhile is a conflict at Apply
      expectedText: null,
      source: { lang: 'en', text: 'Oak' },
    })
  })

  test('a stop keeps the rows translated so far; the rest counts as not done, not as failed', async () => {
    const { rows } = buildCategoryLabelRows({
      items: [item('1', { en: 'Oak' }), item('2', { en: 'Pine' }), item('3', { en: 'Fir' })],
      category: species,
      lang: 'fr',
      languages,
    })
    const controller = new AbortController()
    const translate = async (params: any) => {
      const answer = await translateAll(params)
      controller.abort()
      return answer
    }
    const result = await runTranslateCategoryItemLabels({
      rows,
      lang: 'fr',
      generateText,
      guard: noGuard,
      signal: controller.signal,
      translate,
      batchSize: 1,
    })
    expect(result.rows.map((row) => row.ref)).toEqual(['1'])
    expect(result.failedCount).toBe(0)
    expect(result.notDoneCount).toBe(2)
    expect(result.stop).toMatchObject({ cause: 'cancelled', done: 1, total: 3 })
  })

  test('apply: one request per chunk, the store refreshed and the event sent once at the end', async () => {
    const { rows } = buildCategoryLabelRows({
      items: ['1', '2', '3', '4', '5'].map((ref) => item(ref, { en: `Item ${ref}` })),
      category: species,
      lang: 'fr',
      languages,
    })
    const translated = rows.map((row) => ({ ...row, aiText: `fr ${row.ref}` }))
    const operations = toCategoryLabelDrafts(translated, 'fr').map((draft: any) => ({ ...draft, id: draft.itemUuid }))
    const requests: any[] = []
    const events: string[] = []
    const results = new Map<string, OperationResult>()
    await applyCategoryItemLabels({
      changeSet: { id: 'cs', surveyId: 7, summary: '', operations, createdAt: '' },
      operations,
      getSurvey: () => ({ id: 7 }),
      results,
      chunkSize: 2,
      deps: {
        putCategoryItemLabels: async ({ surveyId, items }) => {
          requests.push({ surveyId, items })
          // the second request fails; item-5 changed meanwhile
          if (requests.length === 2) throw new Error('offline')
          const conflict = items.filter(({ itemUuid }) => itemUuid === 'item-5')
          return {
            applied: items
              .filter(({ itemUuid }) => itemUuid !== 'item-5')
              .map(({ itemUuid, lang }) => ({ itemUuid, lang })),
            conflicts: conflict.map(({ itemUuid, lang }) => ({
              itemUuid,
              lang,
              reason: 'valueChanged' as const,
              currentText: 'Autre',
            })),
            categories: [{ uuid: species.uuid }],
          }
        },
        onCategoriesUpdated: (categories) => events.push(`categories:${categories.length}`),
        onCategoryLabelsApplied: () => events.push('applied'),
      },
    })
    expect(requests.map(({ items }) => items.map(({ itemUuid }: any) => itemUuid))).toEqual([
      ['item-1', 'item-2'],
      ['item-3', 'item-4'],
      ['item-5'],
    ])
    expect(requests[0].items[0]).toEqual({ itemUuid: 'item-1', lang: 'fr', text: 'fr 1', expectedText: null })
    expect([...results.values()].map(({ id, status }) => [id, status])).toEqual([
      ['item-1', 'applied'],
      ['item-2', 'applied'],
      ['item-3', 'failed'],
      ['item-4', 'failed'],
      ['item-5', 'conflict'],
    ])
    expect(events).toEqual(['categories:1', 'applied'])
  })
})
