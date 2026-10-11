import * as NodeDef from '@core/survey/nodeDef'

import { AiLimits } from '@common/ai/limits'
import { buildAssistantDesignPrompt } from '@common/ai/prompts/assistantDesign'
import type { ChangeSet, LabelKind } from '@webapp/ai/changeSets/types'
import {
  MISSING_TEXTS_MAX_JSON_CHARS,
  surveyListMissingTextsTool,
} from '@webapp/ai/tools/design/surveyListMissingTexts'
import { getTools, runTool } from '@webapp/ai/tools/registry'
import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'
import { withNodeDef, withSavedNodeDefs, withTexts } from '@test/unit/utils/designSuggestionTestUtils'

let survey: any

// en + fr; every def but tree has an English label; no descriptions
beforeAll(async () => {
  survey = withSavedNodeDefs(await buildAssistantSurvey({ languages: ['en', 'fr'] }))
})

const uuidOf = (name: string) => NodeDef.getUuid(getDefByName(survey, name))
const list = (input: unknown, overrides: Record<string, unknown> = {}): Promise<any> =>
  runTool(surveyListMissingTextsTool, input, createToolContext({ survey, ...overrides }))
const slotsOf = (page: any) => page.items.map((item: any) => `${item.nodeDefName}:${item.kind}`)

// a card not applied yet, with label.set operations
const pendingTexts = (names: string[], lang: string, kind: LabelKind = 'labels'): ChangeSet => ({
  id: `cs-${lang}-${kind}`,
  surveyId: 7,
  summary: 'Texts',
  createdAt: '2026-10-11T10:00:00.000Z',
  operations: names.map((name, index) => ({
    id: `o${index}`,
    type: 'label.set',
    nodeDefUuid: uuidOf(name),
    kind,
    lang,
    from: null,
    to: `${name} (${lang})`,
  })),
})

describe('survey_listMissingTexts (221)', () => {
  test('lists the texts missing in a language in hierarchy order, with the source text', async () => {
    const page = await list({ lang: 'fr' })
    expect(page).toEqual({
      lang: 'fr',
      total: 6,
      items: [
        { nodeDefName: 'cluster', kind: 'labels', sourceLang: 'en', sourceText: 'Cluster' },
        { nodeDefName: 'cluster_id', kind: 'labels', sourceLang: 'en', sourceText: 'Cluster id' },
        { nodeDefName: 'cluster_notes', kind: 'labels', sourceLang: 'en', sourceText: 'Notes' },
        { nodeDefName: 'plot', kind: 'labels', sourceLang: 'en', sourceText: 'Plot' },
        { nodeDefName: 'plot_id', kind: 'labels', sourceLang: 'en', sourceText: 'Plot id' },
        { nodeDefName: 'tree_dec_1', kind: 'labels', sourceLang: 'en', sourceText: 'Tree dec 1' },
      ],
      nextCursor: null,
    })
  })

  test('the source is the first survey language that has the text', async () => {
    const changed = withTexts(survey, 'tree', 'labels', { fr: 'Arbre' })
    const page = await list({ lang: 'en' }, { survey: changed })
    expect(page.items).toEqual([{ nodeDefName: 'tree', kind: 'labels', sourceLang: 'fr', sourceText: 'Arbre' }])
  })

  test('pages by limit; nextCursor gives the rest', async () => {
    const first = await list({ lang: 'fr', limit: 4 })
    expect(slotsOf(first)).toEqual(['cluster:labels', 'cluster_id:labels', 'cluster_notes:labels', 'plot:labels'])
    expect(first.nextCursor).toBe('8')
    const second = await list({ lang: 'fr', limit: 4, cursor: first.nextCursor })
    expect(slotsOf(second)).toEqual(['plot_id:labels', 'tree_dec_1:labels'])
    expect(second).toMatchObject({ total: 6, nextCursor: null })
  })

  test('skips the texts of pending cards, so nextCursor still gives the rest and total drops', async () => {
    const first = await list({ lang: 'fr', limit: 3 })
    expect(slotsOf(first)).toEqual(['cluster:labels', 'cluster_id:labels', 'cluster_notes:labels'])
    // the model proposed page 1: its card is pending
    const pending = [pendingTexts(['cluster', 'cluster_id', 'cluster_notes'], 'fr')]
    const next = await list({ lang: 'fr', limit: 3, cursor: first.nextCursor }, { getPendingChangeSets: () => pending })
    expect(slotsOf(next)).toEqual(['plot:labels', 'plot_id:labels', 'tree_dec_1:labels'])
    expect(next).toMatchObject({ total: 3, nextCursor: null })
    // restarting without a cursor gives the same texts
    const restart = await list({ lang: 'fr', limit: 3 }, { getPendingChangeSets: () => pending })
    expect(slotsOf(restart)).toEqual(slotsOf(next))
  })

  test('a pending text in another language does not hide the missing one', async () => {
    const pending = [pendingTexts(['cluster'], 'en')]
    const page = await list({ lang: 'fr' }, { getPendingChangeSets: () => pending })
    expect(slotsOf(page)[0]).toBe('cluster:labels')
  })

  test('kind and onlyEmpty: texts empty in every language, lang ignored', async () => {
    expect(await list({ lang: 'fr', kind: 'descriptions' })).toEqual({
      lang: 'fr',
      total: 0,
      items: [],
      nextCursor: null,
    })
    const labels = await list({ onlyEmpty: true, kind: 'labels', lang: 'xx' })
    expect(labels).toEqual({
      lang: null,
      total: 1,
      items: [{ nodeDefName: 'tree', kind: 'labels', sourceLang: null, sourceText: '' }],
      nextCursor: null,
    })
    const all = await list({ onlyEmpty: true })
    expect(slotsOf(all)).toEqual([
      'cluster:descriptions',
      'cluster_id:descriptions',
      'cluster_notes:descriptions',
      'plot:descriptions',
      'plot_id:descriptions',
      'tree:labels',
      'tree:descriptions',
      'tree_dec_1:descriptions',
    ])
    // a pending description in any language takes the text off the empty list
    const pending = [pendingTexts(['plot'], 'fr', 'descriptions')]
    const withPending = await list({ onlyEmpty: true, kind: 'descriptions' }, { getPendingChangeSets: () => pending })
    expect(slotsOf(withPending)).not.toContain('plot:descriptions')
  })

  test("lists only the accepted suggestion's targets", async () => {
    const translations = await list(
      { lang: 'fr' },
      { suggestionScope: { kind: 'missingTranslations', targetKeys: [`${uuidOf('plot')}:labels`] } }
    )
    expect(slotsOf(translations)).toEqual(['plot:labels'])
    const descriptions = await list(
      { onlyEmpty: true, kind: 'descriptions' },
      { suggestionScope: { kind: 'newEntriesDescriptions', targetKeys: [uuidOf('tree_dec_1')] } }
    )
    expect(slotsOf(descriptions)).toEqual(['tree_dec_1:descriptions'])
    // the scope of a kind that does not list texts does not limit the list
    const other = await list({ lang: 'fr' }, { suggestionScope: { kind: 'entityWithoutKey', targetKeys: ['x'] } })
    expect(other.total).toBe(6)
  })

  test('unsaved node definitions are not listed', async () => {
    const changed = withNodeDef(survey, 'cluster_notes', (nodeDef) => ({ ...nodeDef, temporary: true }))
    expect(slotsOf(await list({ lang: 'fr' }, { survey: changed }))).not.toContain('cluster_notes:labels')
  })

  test('a page stops before the JSON budget; a long text is cut and flagged; the next pages hold the rest', async () => {
    let big = survey
    for (const name of ['cluster', 'cluster_id', 'cluster_notes', 'plot', 'plot_id', 'tree', 'tree_dec_1']) {
      big = withTexts(big, name, 'labels', { en: 'x'.repeat(1990) })
    }
    big = withTexts(big, 'cluster', 'descriptions', { en: 'y'.repeat(3000) })
    const pages: any[] = []
    let cursor: string | null = null
    do {
      const page: any = await list(cursor === null ? { lang: 'fr' } : { lang: 'fr', cursor }, { survey: big })
      expect(JSON.stringify(page).length).toBeLessThanOrEqual(MISSING_TEXTS_MAX_JSON_CHARS)
      pages.push(page)
      cursor = page.nextCursor
    } while (cursor !== null && pages.length < 10)
    expect(MISSING_TEXTS_MAX_JSON_CHARS).toBe(AiLimits.assistantToolResultMaxChars - 500)
    expect(pages.length).toBeGreaterThan(1)
    const items = pages.flatMap((page) => page.items)
    expect(items.map((item) => `${item.nodeDefName}:${item.kind}`)).toEqual([
      'cluster:labels',
      'cluster:descriptions',
      'cluster_id:labels',
      'cluster_notes:labels',
      'plot:labels',
      'plot_id:labels',
      'tree:labels',
      'tree_dec_1:labels',
    ])
    expect(items[1].sourceText).toHaveLength(2000)
    expect(items[1].sourceTextTruncated).toBe(true)
    expect(items[0].sourceTextTruncated).toBeUndefined()
  })

  test('refuses a missing or foreign language and a bad cursor or limit', async () => {
    const noLang = await list({})
    expect(noLang.error.code).toBe('invalidInput')
    expect(noLang.error.message).toContain('lang')
    const foreign = await list({ lang: 'de' })
    expect(foreign.error.code).toBe('invalidInput')
    expect(foreign.error.message).toContain('en, fr')
    expect((await list({ lang: 'fr', cursor: 'abc' })).error.code).toBe('invalidInput')
    expect((await list({ lang: 'fr', limit: 51 })).error.code).toBe('invalidInput')
  })

  test('is a Design read tool, also for viewers, and the Design prompt names it', () => {
    const ctx = createToolContext({ survey, canEditSurvey: false })
    const names = getTools({
      area: 'design',
      ctx,
      effective: { schema: 'cloud', data: 'off' },
      hostingClass: 'cloud',
    }).map((tool) => tool.name)
    expect(names).toContain('survey_listMissingTexts')
    expect(surveyListMissingTextsTool).toMatchObject({ effect: 'read', dataClass: 'schema', area: ['design'] })
    const prompt = buildAssistantDesignPrompt({
      uiLang: 'en',
      surveyName: 'demo',
      surveyLabel: 'Demo',
      languages: ['en', 'fr'],
      cycle: '0',
      viewDescription: null,
    })
    expect(prompt).toContain('survey_listMissingTexts')
  })
})
