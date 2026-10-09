import { z } from 'zod'

import { searchHandbook, type HandbookIndex } from '@webapp/ai/help/handbookSearch'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'

import type { AiTool } from '../types'

type DocsSearchInput = { query: string }

/**
 * Creates the docs_search tool (the index loader is injectable for tests).
 * @param {object} deps - Dependencies.
 * @param {Function} deps.loadIndex - Returns the handbook index.
 * @returns {AiTool} The tool.
 */
export const createDocsSearchTool = ({
  loadIndex,
}: {
  loadIndex: () => Promise<HandbookIndex>
}): AiTool<DocsSearchInput> => ({
  name: 'docs_search',
  description:
    'Searches the Open Foris Arena user manual (English) and returns the 3 best sections { id, title, path, text }. ' +
    'Search with English keywords. Answer from these texts only and cite the sections you used as "§<id> <title>".',
  inputSchema: z.object({
    query: z.string().trim().min(1).max(200).describe('English keywords, e.g. "publish survey"'),
  }),
  area: ['help', 'design'],
  dataClass: 'schema',
  effect: 'read',
  requires: () => true,
  execute: async ({ query }) => {
    const results = searchHandbook(await loadIndex(), query)
    return results.length > 0
      ? { results }
      : { results, note: 'No section matches: try other words, or a title from the outline.' }
  },
})

export const docsSearchTool = createDocsSearchTool({ loadIndex: async () => (await loadHandbook()).index })
