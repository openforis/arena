import { z } from 'zod'

import { CONVERSATION_TITLE_TOOL_NAME } from '@common/ai/prompts/assistantConversationTitle'

import { cleanConversationTitle } from '@webapp/ai/conversations/conversationModel'

import { AiToolFailure } from '../toolFailure'
import type { AiTool } from '../types'

export const conversationSetTitleTool: AiTool<{ title: string }> = {
  name: CONVERSATION_TITLE_TOOL_NAME,
  description:
    'Sets the title of this conversation in the conversation list: 3 to 6 words naming its topic, in the language ' +
    'of your answer. Offered on the first message only.',
  inputSchema: z.object({ title: z.string().max(200).describe('Short title, e.g. "Tree height attribute"') }).strict(),
  area: ['design', 'help', 'analysis', 'cleaning'],
  // the title comes from the model's own text: no survey content is read
  dataClass: 'schema',
  effect: 'read',
  // set by the turn on the first message only
  requires: (ctx) => Boolean(ctx.setConversationTitle),
  execute: async ({ title }, ctx) => {
    const cleaned = cleanConversationTitle(title)
    if (!cleaned) throw new AiToolFailure('emptyTitle', 'The title is empty: give 3 to 6 words.')
    ctx.setConversationTitle?.(cleaned)
    return { title: cleaned }
  },
}
