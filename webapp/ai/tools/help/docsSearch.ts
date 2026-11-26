import { z } from 'zod'

import { type HandbookIndex, searchHandbook } from '@webapp/ai/help/handbookSearch'
import { loadHandbook } from '@webapp/ai/help/loadHandbook'
import type { AiTool } from '../types'

const inputSchema = z.object({
  query: z.string().trim().min(1).max(200).describe('Keywords in the language of the manual, e.g. "publish survey"'),
})

type DocsSearchInput = z.infer<typeof inputSchema>

/**
 * Creates the docs_search tool (the index loader is injectable for tests).
 * @param {object} deps - Dependencies.
 * @param {Function} deps.loadIndex - Returns the handbook index of an interface language.
 */
export const createDocsSearchTool = ({
  loadIndex,
}: {
  loadIndex: (uiLang: string) => Promise<HandbookIndex>
}): AiTool<DocsSearchInput> => ({
  name: 'docs_search',
  description:
    'Searches the Open Foris Arena user manual and returns the 3 best sections { id, title, path, text }. The manual ' +
    'is in the answer language when that is English, French or Spanish, in English otherwise: search with keywords ' +
    'in the language of the manual. Answer from these texts only and cite the sections you used as "§<id> <title>".',
  inputSchema,
  area: ['help', 'design', 'analysis', 'cleaning'],
  dataClass: 'schema',
  requires: () => true,
  execute: async ({ query }, { uiLang }) => {
    // the anchors are for the links the app adds, not for the model
    const results = searchHandbook(await loadIndex(uiLang), query).map(({ anchor: _anchor, ...result }) => result)
    return results.length > 0
      ? { results }
      : { results, note: 'No section matches: try other words, or a title from the outline.' }
  },
})

export const docsSearchTool = createDocsSearchTool({ loadIndex: async (uiLang) => (await loadHandbook(uiLang)).index })
