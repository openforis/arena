import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'

import { buildConversationTitleInstruction } from '@common/ai/prompts/assistantConversationTitle'

import { buildAssistantSystemPrompt } from '@webapp/ai/agent/assistantSystemPrompt'
import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { cleanConversationTitle, createConversation } from '@webapp/ai/conversations/conversationModel'
import type { Conversation } from '@webapp/ai/conversations/types'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'
import { conversationSetTitleTool } from '@webapp/ai/tools/common/conversationSetTitle'
import { getTools, runTool } from '@webapp/ai/tools/registry'
import { isHiddenToolPart } from '@webapp/components/ai/Assistant/assistantPanelModel'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'

const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } }
const finish = (unified: string) => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage })

const textStream = (text: string): any =>
  convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 't' },
    { type: 'text-delta', id: 't', delta: text },
    { type: 'text-end', id: 't' },
    finish('stop'),
  ] as any[])

const titleCallStream = (title: string): any =>
  convertArrayToReadableStream([
    { type: 'stream-start', warnings: [] },
    { type: 'tool-call', toolCallId: 'c1', toolName: 'conversation_setTitle', input: JSON.stringify({ title }) },
    finish('tool-calls'),
  ] as any[])

const scriptedModel = (...streams: (() => any)[]) => {
  let call = 0
  return new MockLanguageModelV4({
    doStream: async () => ({ stream: streams[Math.min(call++, streams.length - 1)]() }) as any,
  })
}

const cloudAccess = { effective: { schema: 'cloud', data: 'onDevice' } as any, hostingClass: 'cloud' as const }

const run = ({
  model,
  conversation = createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
  userMessage = 'Add a tree height attribute to the tree entity, in metres, between 1 and 80',
  onUpdate = () => {},
}: {
  model: MockLanguageModelV4
  conversation?: Conversation
  userMessage?: string
  onUpdate?: (conversation: Conversation) => void
}) =>
  runAssistantTurn({
    conversation,
    userMessage,
    area: 'design',
    ctx: createToolContext(),
    access: cloudAccess,
    onUpdate,
    signal: new AbortController().signal,
    model,
    systemPrompt: 'SYSTEM',
    tools: [conversationSetTitleTool],
  })

const offeredToolNames = (model: MockLanguageModelV4): string[] =>
  (model.doStreamCalls[0].tools ?? []).map((tool: any) => tool.name)

describe('cleanConversationTitle (249)', () => {
  test('one line, without quotes, markdown or a final period, at most 60 characters', () => {
    expect(cleanConversationTitle('  "Tree height  attribute."  ')).toBe('Tree height attribute')
    expect(cleanConversationTitle('**Spanish\ntranslations**')).toBe('Spanish translations')
    expect(cleanConversationTitle('« Étiquettes en français »')).toBe('Étiquettes en français')
    expect(cleanConversationTitle('x'.repeat(80))).toBe(`${'x'.repeat(59)}…`)
    expect(cleanConversationTitle(' "" ')).toBe('')
  })
})

describe('conversation_setTitle tool (249)', () => {
  test('offered in every area, only when the turn can set the title', () => {
    expect(ALL_TOOLS).toContain(conversationSetTitleTool)
    expect(conversationSetTitleTool.area).toEqual(['design', 'help', 'analysis', 'cleaning'])
    const effective = { schema: 'cloud', data: 'onDevice' } as const
    const names = (ctx: ReturnType<typeof createToolContext>) =>
      getTools({ area: 'help', ctx, effective, hostingClass: 'cloud', tools: [conversationSetTitleTool] }).map(
        (tool) => tool.name
      )
    expect(names(createToolContext())).toEqual([])
    expect(names(createToolContext({ setConversationTitle: () => undefined }))).toEqual(['conversation_setTitle'])
  })

  test('sets the cleaned title; an empty title is an error the model can fix', async () => {
    const titles: string[] = []
    const ctx = createToolContext({ setConversationTitle: (title) => titles.push(title) })
    expect(await runTool(conversationSetTitleTool, { title: ' "Tree height." ' }, ctx)).toEqual({
      title: 'Tree height',
    })
    expect(titles).toEqual(['Tree height'])
    expect(await runTool(conversationSetTitleTool, { title: '""' }, ctx)).toMatchObject({
      error: { code: 'emptyTitle' },
    })
    expect(titles).toEqual(['Tree height'])
  })

  test('its tool rows are hidden in the chat', () => {
    expect(isHiddenToolPart({ type: 'tool', toolCallId: 'c', toolName: 'conversation_setTitle' } as any)).toBe(true)
    expect(isHiddenToolPart({ type: 'tool', toolCallId: 'c', toolName: 'nodeDef_get' } as any)).toBe(false)
  })
})

describe('conversation title in a turn (249)', () => {
  test('the first turn offers the tool; the model title replaces the empty one', async () => {
    const updates: string[] = []
    const model = scriptedModel(
      () => titleCallStream('Tree height attribute'),
      () => textStream('I prepared it.')
    )
    const result = await run({ model, onUpdate: (next) => updates.push(next.title) })
    expect(offeredToolNames(model)).toEqual(['conversation_setTitle'])
    expect(updates[0]).toBe('')
    expect(result.title).toBe('Tree height attribute')
  })

  test('without the call the first message is the title, set when the turn ends', async () => {
    const result = await run({ model: scriptedModel(() => textStream('Done.')) })
    expect(result.title).toBe('Add a tree height attribute to the tree entity, in metres, …')
  })

  test('the later turns neither offer the tool nor change the title', async () => {
    const earlier: Conversation = {
      ...createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
      title: 'Tree height attribute',
      messages: [{ id: 'u0', role: 'user', text: 'Add a tree height', createdAt: '2026-10-12T10:00:00.000Z' }],
    }
    const model = scriptedModel(() => textStream('Sure.'))
    const result = await run({ model, conversation: earlier, userMessage: 'Make it required' })
    expect(offeredToolNames(model)).toEqual([])
    expect(result.title).toBe('Tree height attribute')
  })
})

describe('title instruction in the system prompt (249)', () => {
  test('added only when the tool is offered, in the answer language', () => {
    const ctx = createToolContext({ uiLang: 'es' })
    const instruction = buildConversationTitleInstruction('es')
    expect(instruction).toContain('conversation_setTitle')
    expect(instruction).toContain('Spanish')
    const withTool = buildAssistantSystemPrompt({ area: 'help', ctx, outline: null, titleToolAvailable: true })
    expect(withTool.endsWith(instruction)).toBe(true)
    const without = buildAssistantSystemPrompt({ area: 'help', ctx, outline: null })
    expect(without).not.toContain('conversation_setTitle')
  })
})
