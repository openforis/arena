import * as NodeDef from '@core/survey/nodeDef'

import { runSuggestionBatchTurn } from '@webapp/ai/agent/runSuggestionBatchTurn'
import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage, ConversationToolPart } from '@webapp/ai/conversations/types'
import { detectMissingTranslations } from '@webapp/ai/suggestions/detectors/missingTranslations'
import {
  MISSING_TRANSLATIONS_CHAT_MAX,
  NEW_ENTRIES_DESCRIPTIONS_CHAT_MAX,
  SUGGESTION_BATCH_TOOL_NAMES,
  getSuggestionBatchKind,
  getSuggestionBatchToolKind,
  withRemainingTime,
  type SuggestionBatchKind,
} from '@webapp/ai/suggestions/suggestionBatchTurn'
import { missingTextsTranslateTool, runBatchTool } from '@webapp/ai/tools/design/batchTools'
import { buildMissingTextRows, runTranslateMissingTexts } from '@webapp/ai/workflows/translateMissingTexts'
import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { buildCategoryLabelsSurvey, categoryUuidOf } from '@test/unit/utils/categoryLabelsTestUtils'
import { createDetectorContext, withSavedNodeDefs, withTexts } from '@test/unit/utils/designSuggestionTestUtils'

const generateText = async () => ''
const noGuard = async () => {}
const resolveBatch = async () => ({ generateText, guard: noGuard })

/**
 * Fake translateItems: every item becomes "<lang>:<text>", except the texts listed as dropped.
 * @param {string[]} dropped - Source texts the model leaves out.
 * @returns {Function} The task.
 */
const translateAllBut =
  (dropped: string[] = []) =>
  async ({ targetLangs, items }: any) => ({
    translations: items
      .filter(({ text }: any) => !dropped.includes(text))
      .map(({ id, text }: any) => ({ id, byLang: { [targetLangs[0]]: `${targetLangs[0]}:${text}` } })),
  })

let survey: any

// en, fr, es: cluster has its 3 labels; plot has en and es; plot_id only es; tree_dec_1 has an en description
beforeAll(async () => {
  let built = withSavedNodeDefs(await buildAssistantSurvey({ languages: ['en', 'fr', 'es'] }))
  built = withTexts(built, 'cluster', 'labels', { en: 'Cluster', fr: 'Grappe', es: 'Conglomerado' })
  built = withTexts(built, 'plot', 'labels', { en: 'Plot', es: 'Parcela' })
  built = withTexts(built, 'plot_id', 'labels', { es: 'Id de parcela' })
  built = withTexts(built, 'tree_dec_1', 'descriptions', { en: 'Decimal of the tree' })
  survey = built
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))

/**
 * Fake data dictionary task: "About <name>" for every node definition; records the language asked.
 * @param {string[]} languages - Receives the language of each call.
 * @returns {Function} The task.
 */
const describeAll =
  (languages: (string | undefined)[] = []) =>
  async ({ nodeDefs, language }: any) => {
    languages.push(language)
    return { descriptions: nodeDefs.map(({ uuid, name }: any) => ({ uuid, description: `About ${name}` })) }
  }

describe('missing texts batch (611)', () => {
  test('rows: the texts of the suggestion, each with its source (the default language first)', () => {
    const { rows, skippedCount } = buildMissingTextRows({ survey, lang: 'fr' })
    const suggestion = detectMissingTranslations(createDetectorContext({ survey })).find(({ id }) => id.endsWith(':fr'))
    expect(rows.map(({ nodeDefUuid, kind }) => `${nodeDefUuid}:${kind}`)).toEqual(
      suggestion?.targets.map(({ key }) => key)
    )
    expect(rows.find(({ nodeDefUuid }) => nodeDefUuid === uuidOf('plot'))?.source).toEqual({ lang: 'en', text: 'Plot' })
    expect(rows.find(({ nodeDefUuid }) => nodeDefUuid === uuidOf('plot_id'))?.source).toEqual({
      lang: 'es',
      text: 'Id de parcela',
    })
    expect(rows.some(({ nodeDefUuid }) => nodeDefUuid === uuidOf('cluster'))).toBe(false)
    expect(skippedCount).toBe(0)
  })

  test('rows: a source too long is counted, not sent; a run takes at most maxItems rows', () => {
    const all = buildMissingTextRows({ survey, lang: 'fr' }).rows
    const limited = buildMissingTextRows({ survey, lang: 'fr', maxChars: 4 })
    expect(limited.rows.map(({ source }) => source.text)).toEqual(
      all.map(({ source }) => source.text).filter((text) => text.length <= 4)
    )
    expect(limited.skippedCount).toBe(all.length - limited.rows.length)
    expect(buildMissingTextRows({ survey, lang: 'fr', maxItems: 2 }).rows).toEqual(all.slice(0, 2))
  })

  test('run: the translated rows, the dropped and too long texts counted as failed', async () => {
    const { rows } = buildMissingTextRows({ survey, lang: 'fr' })
    const { translated, failedCount } = await runTranslateMissingTexts({
      lang: 'fr',
      rows,
      skippedCount: 1,
      generateText,
      guard: noGuard,
      translate: translateAllBut(['Plot']),
    })
    expect(failedCount).toBe(2)
    expect(translated.map(({ nodeDefUuid, kind, aiText }) => [nodeDefUuid, kind, aiText])).toContainEqual([
      uuidOf('plot_id'),
      'labels',
      'fr:Id de parcela',
    ])
    expect(translated.some(({ nodeDefUuid }) => nodeDefUuid === uuidOf('plot'))).toBe(false)
  })

  /**
   * Runs the batch turn of a Do it for French.
   * @param {object} [options] - Options.
   * @param {object} [options.ctxSurvey] - Survey the tools read when the translations are proposed.
   * @param {AbortController} [options.controller] - Turn controller.
   * @param {Function} [options.translate] - Translation task.
   * @returns {Promise<object>} The final conversation, the tool context and the reported progress.
   */
  const runBatch = async ({
    kind = 'missingTranslations',
    batchSurvey = survey,
    ctxSurvey = batchSurvey,
    targetKeys = [],
    controller = new AbortController(),
    translate = translateAllBut(['Plot']),
    fetchPage,
    describe,
  }: {
    kind?: SuggestionBatchKind
    batchSurvey?: any
    ctxSurvey?: any
    targetKeys?: string[]
    controller?: AbortController
    translate?: any
    fetchPage?: any
    describe?: any
  } = {}) => {
    const ctx = createToolContext({ survey: batchSurvey, getSurvey: () => ctxSurvey })
    const conversation = {
      ...createConversation({ userUuid: 'u', surveyId: 7, area: 'design' }),
      suggestionScope: { kind, key: 'fr', targetKeys },
    }
    const progress: unknown[] = []
    const final = await runSuggestionBatchTurn({
      kind,
      conversation,
      userMessage: 'Translate the texts missing in fr',
      displayText: 'Translate the missing texts',
      ctx,
      onUpdate: (next) => {
        const answer = next.messages.at(-1) as AssistantMessage
        const part = answer.parts.find((p) => p.type === 'tool') as ConversationToolPart | undefined
        if (part?.state === 'running' && part.output) progress.push(part.output)
      },
      signal: controller.signal,
      resolveBatch,
      translate,
      fetchPage,
      describe,
    })
    const answer = final.messages.at(-1) as AssistantMessage
    const tool = answer.parts.find((p) => p.type === 'tool') as ConversationToolPart
    return { final, answer, tool, ctx, progress }
  }

  test('batch turn: says it translates in batches, shows the progress, proposes every translation on one card', async () => {
    const { final, answer, tool, ctx, progress } = await runBatch()
    const { rows } = buildMissingTextRows({ survey, lang: 'fr' })
    expect(answer.status).toBe('done')
    expect(answer.parts[0]).toEqual({
      type: 'text',
      text: `aiAssistant.missingTextsBatch.start ${JSON.stringify({ count: rows.length, lang: 'French', size: 20 })}`,
    })
    expect(tool).toMatchObject({
      toolName: SUGGESTION_BATCH_TOOL_NAMES.missingTranslations,
      state: 'done',
      input: { name: 'French', count: rows.length },
    })
    // one call per source language (en, es)
    expect(progress.at(-1)).toEqual({ done: 2, total: 2 })
    const [changeSet] = ctx.changeSets
    expect(Object.keys(final.changeSets)).toEqual([changeSet.id])
    expect(tool.output).toMatchObject({ changeSetId: changeSet.id, operations: rows.length - 1 })
    expect(
      changeSet.operations.every((op: any) => op.type === 'label.set' && op.lang === 'fr' && op.from === null)
    ).toBe(true)
    expect(answer.parts.at(-1)).toEqual({
      type: 'text',
      text: `aiAssistant.missingTextsBatch.done {"count":${rows.length - 1}} aiAssistant.missingTextsBatch.failed {"count":1}`,
    })
  })

  test('batch turn: a text filled during the run is not proposed', async () => {
    const filled = withTexts(survey, 'plot_id', 'labels', { es: 'Id de parcela', fr: 'Id de placette' })
    const { ctx } = await runBatch({ ctxSurvey: filled, translate: translateAllBut() })
    const uuids = ctx.changeSets[0].operations.map((op: any) => op.nodeDefUuid)
    expect(uuids).not.toContain(uuidOf('plot_id'))
    expect(uuids).toContain(uuidOf('plot'))
  })

  test('batch turn: stopped before the first call, nothing is proposed and the answer is stopped', async () => {
    const controller = new AbortController()
    controller.abort()
    const { answer, tool, ctx } = await runBatch({ controller })
    expect(answer.status).toBe('stopped')
    expect(tool.state).toBe('failed')
    expect(ctx.changeSets).toEqual([])
  })

  test('batch turn of the category labels: the missing labels read from the server, proposed on one card', async () => {
    const categorySurvey = await buildCategoryLabelsSurvey()
    const speciesUuid = categoryUuidOf(categorySurvey, 'species')
    const pages: any[] = []
    const fetchPage = async (params: any) => {
      pages.push(params)
      return {
        total: 2,
        items: [
          { uuid: 'item-1', levelIndex: 0, levelName: 'genus', codePath: ['1'], labels: { en: 'Pine' } },
          { uuid: 'item-2', levelIndex: 0, levelName: 'genus', codePath: ['2'], labels: { en: 'Oak', fr: 'Chêne' } },
        ],
        nextCursor: null,
      }
    }
    const { answer, tool, ctx } = await runBatch({
      kind: 'categoryItemTranslations',
      batchSurvey: categorySurvey,
      targetKeys: [speciesUuid, 'deleted-category'],
      translate: translateAllBut(),
      fetchPage,
    })
    expect(pages.map(({ categoryUuid, lang }) => [categoryUuid, lang])).toEqual([[speciesUuid, 'fr']])
    expect(answer.status).toBe('done')
    expect((answer.parts[0] as any).text).toMatch(/^aiAssistant\.missingTextsBatch\.categoryStart /)
    expect(tool).toMatchObject({ toolName: 'categoryItemLabels_translate', state: 'done', input: { count: 1 } })
    expect(ctx.changeSets[0].operations).toEqual([
      expect.objectContaining({
        type: 'categoryItemLabel.set',
        itemUuid: 'item-1',
        text: 'fr:Pine',
        expectedText: null,
      }),
    ])
  })

  test('batch turn of the descriptions: written in the default language, then translated, on one card', async () => {
    const languages: (string | undefined)[] = []
    const targets = ['cluster', 'plot', 'plot_id', 'tree_dec_1']
    const { answer, tool, ctx, progress } = await runBatch({
      kind: 'newEntriesDescriptions',
      targetKeys: targets.map(uuidOf),
      translate: translateAllBut(),
      describe: describeAll(languages),
    })
    expect(languages).toEqual(['English'])
    expect(answer.status).toBe('done')
    expect((answer.parts[0] as any).text).toBe(
      `aiAssistant.missingTextsBatch.descriptionsStart ${JSON.stringify({ count: 3, lang: 'English, French, Spanish', size: 20 })}`
    )
    expect(tool).toMatchObject({ toolName: 'descriptions_write', state: 'done', input: { count: 3 } })
    // one request to write them, one per other language to translate them
    expect(progress.at(-1)).toEqual({ done: 3, total: 3 })
    const operations = ctx.changeSets[0].operations as any[]
    // tree_dec_1 has a description already
    expect(operations).toHaveLength(9)
    expect(operations.every((op) => op.type === 'label.set' && op.kind === 'descriptions' && op.from === null)).toBe(
      true
    )
    expect(operations.find((op) => op.nodeDefUuid === uuidOf('plot') && op.lang === 'fr')?.to).toBe('fr:About plot')
  })

  test('batch tool of the model: validates the language, reports its progress under its row, proposes one card', async () => {
    const ctx = createToolContext({ survey })
    await expect(missingTextsTranslateTool.execute({ lang: 'de' }, ctx)).rejects.toMatchObject({
      code: 'languageNotInSurvey',
    })
    const reported: [string, any][] = []
    const toolCtx = createToolContext({
      survey,
      toolCallId: 'call-1',
      onToolProgress: (id, output) => reported.push([id, output]),
    })
    const { rows } = buildMissingTextRows({ survey, lang: 'fr' })
    const output: any = await runBatchTool({
      kind: 'missingTranslations',
      lang: 'fr',
      targetKeys: [],
      ctx: toolCtx,
      resolveBatch,
      deps: { translate: translateAllBut(['Plot']) },
    })
    expect(reported[0]).toEqual(['call-1', { name: 'French', count: rows.length }])
    expect(reported.at(-1)).toEqual(['call-1', { done: 2, total: 2, name: 'French', count: rows.length }])
    expect(output).toMatchObject({
      changeSetId: toolCtx.changeSets[0].id,
      name: 'French',
      count: rows.length,
      failed: 1,
    })
  })

  test('Do it runs as a batch: the category labels always, the missing texts above one call; first message only', () => {
    const conversation = (kind: any, count: number, messages: any[] = []) => ({
      ...createConversation({ userUuid: 'u', surveyId: 7, area: 'design' }),
      messages,
      suggestionScope: {
        kind,
        key: 'fr',
        targetKeys: Array.from({ length: count }, (_, index) => `uuid-${index}:labels`),
      },
    })
    expect(getSuggestionBatchKind(conversation('missingTranslations', MISSING_TRANSLATIONS_CHAT_MAX))).toBeNull()
    expect(getSuggestionBatchKind(conversation('missingTranslations', MISSING_TRANSLATIONS_CHAT_MAX + 1))).toBe(
      'missingTranslations'
    )
    expect(getSuggestionBatchKind(conversation('categoryItemTranslations', 1))).toBe('categoryItemTranslations')
    expect(getSuggestionBatchKind(conversation('categoryItemTranslations', 1, [{ role: 'user' }]))).toBeNull()
    expect(getSuggestionBatchKind(conversation('validationErrors', 100))).toBeNull()
    expect(getSuggestionBatchKind(conversation('newEntriesDescriptions', NEW_ENTRIES_DESCRIPTIONS_CHAT_MAX))).toBeNull()
    const descriptions = conversation('newEntriesDescriptions', NEW_ENTRIES_DESCRIPTIONS_CHAT_MAX + 1)
    // the descriptions need no language
    expect(
      getSuggestionBatchKind({ ...descriptions, suggestionScope: { ...descriptions.suggestionScope, key: '' } })
    ).toBe('newEntriesDescriptions')
    const keyless = conversation('categoryItemTranslations', 1)
    expect(getSuggestionBatchKind({ ...keyless, suggestionScope: { ...keyless.suggestionScope, key: '' } })).toBeNull()
  })

  test('progress: the time left estimated from the second request on, until the last one', () => {
    expect(withRemainingTime({ done: 1, total: 18 }, 10_000)).toEqual({ done: 1, total: 18 })
    expect(withRemainingTime({ done: 7, total: 18 }, 70_000)).toEqual({ done: 7, total: 18, remainingMs: 110_000 })
    expect(withRemainingTime({ done: 18, total: 18 }, 180_000)).toEqual({ done: 18, total: 18 })
  })

  test('tool rows of the batches: their kind; a tool of the model has none', () => {
    expect(getSuggestionBatchToolKind('missingTexts_translate')).toBe('missingTranslations')
    expect(getSuggestionBatchToolKind('categoryItemLabels_translate')).toBe('categoryItemTranslations')
    expect(getSuggestionBatchToolKind('descriptions_write')).toBe('newEntriesDescriptions')
    expect(getSuggestionBatchToolKind('labels_proposeSet')).toBeNull()
  })
})
