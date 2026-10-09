import en from '@core/i18n/resources/en/common'

import { buildHandbookIndex, getHandbookOutline, searchHandbook, tokenize } from '@webapp/ai/help/handbookSearch'
import type { Handbook } from '@webapp/ai/help/handbookSplitter'
import { createHandbookLoader, loadHandbook } from '@webapp/ai/help/loadHandbook'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'
import { createDocsSearchTool } from '@webapp/ai/tools/help/docsSearch'
import { AI_TOOL_NAME_PATTERN, runTool } from '@webapp/ai/tools/registry'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const section = (id: string, title: string, text: string) => ({ id, title, path: [], text })

const handbook: Handbook = {
  source: 'test',
  version: '1',
  fetchedAt: '2026-10-06',
  sections: [
    section('1', 'Introduction', 'Arena is a platform. Tables are mentioned here once.'),
    section('7.2', 'Form Design', 'Add attributes and entities to the form.'),
    section('7.2.3', 'Tables', 'A multiple entity can be shown as a table. Each row of the table is an entity.'),
    section('9', 'Data export', `${'Export rows as CSV. '.repeat(150)}End.`),
    section('9', 'Data export (2/2)', 'More export details.'),
    section('A1', 'System architecture', 'Arena runs on Node.js and PostgreSQL.'),
  ],
}

const index = buildHandbookIndex(handbook)

describe('handbook search', () => {
  test('tokenize: lowercase, no accents, stop words, short tokens, plurals', () => {
    expect(tokenize('How do I add the Categories to a Survey? Évaluation')).toEqual([
      'add',
      'category',
      'survey',
      'evaluation',
    ])
  })

  test('a title match outranks a mention in the text', () => {
    const results = searchHandbook(index, 'how do I show a table?')
    expect(results.map((result) => result.id)).toEqual(['7.2.3', '1'])
  })

  test('top 3, texts capped at 2,000 characters', () => {
    const results = searchHandbook(index, 'export rows entity arena')
    expect(results).toHaveLength(3)
    const exportSection = results.find((result) => result.title === 'Data export')
    expect(exportSection?.text).toHaveLength(2000)
    expect(exportSection?.truncated).toBe(true)
  })

  test('no match, no results', () => {
    expect(searchHandbook(index, 'kubernetes')).toEqual([])
    expect(searchHandbook(index, 'the of and')).toEqual([])
  })

  test('outline: one line per id, deeper levels dropped to fit', () => {
    expect(getHandbookOutline(handbook)).toBe(
      ['1 Introduction', '7.2 Form Design', '7.2.3 Tables', '9 Data export', 'A1 System architecture'].join('\n')
    )
    expect(getHandbookOutline(handbook, 70)).toBe(
      ['1 Introduction', '7.2 Form Design', '9 Data export', 'A1 System architecture'].join('\n')
    )
  })
})

describe('docs_search', () => {
  const tool = createDocsSearchTool({ loadIndex: async () => index })

  test('returns the best sections; offered in Help and Design without a survey', async () => {
    const result: any = await runTool(tool, { query: 'table' }, createToolContext())
    expect(result.results[0]).toMatchObject({ id: '7.2.3', title: 'Tables' })
    expect(tool.area).toEqual(['help', 'design', 'analysis'])
    expect(tool.requires(createToolContext())).toBe(true)
  })

  test('a failing index load becomes a structured error', async () => {
    const failing = createDocsSearchTool({
      loadIndex: async () => {
        throw new Error('chunk failed')
      },
    })
    const result: any = await runTool(failing, { query: 'table' }, createToolContext())
    expect(result.error).toMatchObject({ code: 'toolFailed', message: 'chunk failed' })
  })

  test('says so when nothing matches', async () => {
    const result: any = await runTool(tool, { query: 'kubernetes' }, createToolContext())
    expect(result.results).toEqual([])
    expect(result.note).toMatch(/other words/)
  })
})

describe('the committed handbook', () => {
  test('loads lazily and answers', async () => {
    const loaded = await loadHandbook()
    expect(new Set(loaded.handbook.sections.map((item) => item.id)).size).toBeGreaterThanOrEqual(50)
    expect(searchHandbook(loaded.index, 'publish survey')[0].title).toMatch(/Publish a survey/)
    expect(searchHandbook(loaded.index, 'branding logo')[0].title).toMatch(/Branding/)
    expect(getHandbookOutline(loaded.handbook).length).toBeLessThanOrEqual(3000)
    expect(await loadHandbook()).toBe(loaded)
  })
})

describe('handbook loader', () => {
  test('retries after a failed import, then loads once', async () => {
    const importer = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ default: handbook })
    const load = createHandbookLoader(importer)
    await expect(load()).rejects.toThrow('offline')
    const loaded = await load()
    expect(loaded.handbook).toBe(handbook)
    expect(await load()).toBe(loaded)
    expect(importer).toHaveBeenCalledTimes(2)
  })

  test('empty sections never take a result slot', async () => {
    const loaded = await loadHandbook()
    expect(loaded.handbook.sections.some((item) => item.text === '')).toBe(true)
    for (const query of ['analysis', 'data', 'survey']) {
      const results = searchHandbook(loaded.index, query)
      expect(results.length).toBeGreaterThan(0)
      expect(results.every((result) => result.text !== '')).toBe(true)
    }
  })
})

describe('all assistant tools', () => {
  test('have valid, unique names and an en label', () => {
    const names = ALL_TOOLS.map((tool) => tool.name)
    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      expect([name, AI_TOOL_NAME_PATTERN.test(name)]).toEqual([name, true])
      expect([name, typeof (en.aiAssistant.tools as Record<string, string>)[name]]).toEqual([name, 'string'])
    }
    expect(names).toContain('docs_search')
  })
})
