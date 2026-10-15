import fs from 'fs'
import path from 'path'

import { MockLanguageModelV4, convertArrayToReadableStream } from 'ai/test'
import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import type { AssistantMessage } from '@webapp/ai/conversations/types'
import { runAssistantTurn } from '@webapp/ai/agent/runAssistantTurn'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'
import { nodeDefGetTool } from '@webapp/ai/tools/design/nodeDefGet'
import { expressionCheckTool } from '@webapp/ai/tools/design/expressionCheck'
import { expressionsProposeSetTool } from '@webapp/ai/tools/design/expressionsProposeSet'
import { createCategoryItemsListMissingLabelsTool } from '@webapp/ai/tools/design/categoryItemsListMissingLabels'
import { createCategoryItemRefs } from '@webapp/ai/tools/design/categoryItemRefs'
import { runTool, toAiSdkTools } from '@webapp/ai/tools/registry'
import type { AiTool } from '@webapp/ai/tools/types'

import { createToolContext, buildAssistantSurvey } from '@test/unit/utils/assistantTestUtils'
import { buildCategoryLabelsSurvey } from '@test/unit/utils/categoryLabelsTestUtils'

const toolsDir = path.resolve(__dirname, '../../../webapp/ai/tools')
const toolFiles = (): { file: string; source: string }[] =>
  fs
    .readdirSync(toolsDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.ts'))
    .map((file) => ({ file, source: fs.readFileSync(path.join(toolsDir, file), 'utf8') }))

describe('the tool metadata has no unused field (388)', () => {
  test('no tool declares an effect', () => {
    for (const tool of ALL_TOOLS) expect(tool).not.toHaveProperty('effect')
    const offenders = toolFiles()
      .filter(({ source }) => /\beffect: '(read|propose)'|AiToolEffect/.test(source))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })
})

describe('input types come from the zod schema (388)', () => {
  test('no tool file writes a type next to its schema by hand', () => {
    const offenders = toolFiles()
      .filter(
        ({ source }) => /^(export )?type \w*Input = \{/m.test(source) && /\bz\.(object|strictObject)\(/.test(source)
      )
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })
})

describe('expression_check trims like expressions_proposeSet (388)', () => {
  const proposeItemSchema = (expressionsProposeSetTool.inputSchema as any).shape.expressions.element

  test('the expression and the condition are trimmed by both schemas', () => {
    const checked: any = expressionCheckTool.inputSchema.parse({
      nodeDefName: 'cluster_id',
      prop: 'validations.expressions',
      expression: '  cluster_id > 0  ',
      applyIf: '  cluster_notes != ""  ',
    })
    const proposed = proposeItemSchema.parse({ expression: '  cluster_id > 0  ', applyIf: '  cluster_notes != ""  ' })
    expect(checked.expression).toBe('cluster_id > 0')
    expect(proposed.expression).toBe(checked.expression)
    expect(checked.applyIf).toBe('cluster_notes != ""')
    expect(proposed.applyIf).toBe(checked.applyIf)
  })

  test('a blank expression is refused before the check', async () => {
    const result: any = await runTool(
      expressionCheckTool,
      { nodeDefName: 'cluster_id', prop: 'defaultValues', expression: '   ' },
      createToolContext({ survey: await buildAssistantSurvey() })
    )
    expect(result.error.code).toBe('invalidInput')
  })
})

describe('the category labels cursor (388)', () => {
  let survey: any
  beforeAll(async () => {
    survey = await buildCategoryLabelsSurvey()
  })

  const listWithServer = (fetchPage: any, input: object) => {
    const tool = createCategoryItemsListMissingLabelsTool({ fetchPage })
    const ctx = createToolContext({
      survey,
      categoryItemRefs: createCategoryItemRefs(),
      getPendingChangeSets: () => [],
      suggestionScope: null,
    })
    return runTool(tool, { categoryName: 'species', lang: 'fr', ...input }, ctx) as Promise<any>
  }

  test('a cursor the server refuses (it answers 400, it does not restart) tells the model to start over', async () => {
    const fetchPage = jest.fn(async () => {
      throw Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } })
    })
    const result = await listWithServer(fetchPage, { cursor: 'page-2' })
    expect(result.error.code).toBe('invalidCursor')
    expect(result.error.message).toContain('without cursor')
  })

  test('a 400 on the first page is not a cursor problem', async () => {
    const fetchPage = jest.fn(async () => {
      throw Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } })
    })
    const result = await listWithServer(fetchPage, {})
    expect(result.error.code).toBe('toolFailed')
  })
})

describe('the survey is read at each tool call (388)', () => {
  test('a tool sees the survey as it is when it runs, not as it was when the turn began', async () => {
    const survey = await buildAssistantSurvey()
    const withoutPlot = Survey.dissocNodeDef(
      NodeDef.getUuid(Survey.getNodeDefsArray(survey).find((def: any) => NodeDef.getName(def) === 'plot') as any)
    )(survey)
    let current: any = survey
    const ctx = createToolContext({ survey, getSurvey: () => current })
    const sdkTool: any = toAiSdkTools([nodeDefGetTool], ctx).nodeDef_get
    const first = await sdkTool.execute({ name: 'plot' })
    expect(first.error).toBeUndefined()
    current = withoutPlot
    const second = await sdkTool.execute({ name: 'plot' })
    expect(second.error.code).toBe('nodeDefNotFound')
  })

  test('without getSurvey the context survey is used', async () => {
    const survey = await buildAssistantSurvey()
    const result: any = await runTool(nodeDefGetTool, { name: 'plot' }, createToolContext({ survey }))
    expect(result.error).toBeUndefined()
  })
})

describe('a tool the model asks for but was not offered (388)', () => {
  const usage = { inputTokens: { total: 1 }, outputTokens: { total: 1 } }
  const finish = (unified: string) => ({ type: 'finish', finishReason: { unified, raw: undefined }, usage })
  const toolCallStream = (toolCallId: string, toolName: string, input: unknown): any =>
    convertArrayToReadableStream([
      { type: 'stream-start', warnings: [] },
      { type: 'tool-call', toolCallId, toolName, input: JSON.stringify(input) },
      finish('tool-calls'),
    ] as any[])
  const textStream = (text: string): any =>
    convertArrayToReadableStream([
      { type: 'stream-start', warnings: [] },
      { type: 'text-start', id: 't' },
      { type: 'text-delta', id: 't', delta: text },
      { type: 'text-end', id: 't' },
      finish('stop'),
    ] as any[])

  const makeTool = (name: string, requires: AiTool['requires'], execute: AiTool['execute']): AiTool => ({
    name,
    description: `${name} tool`,
    inputSchema: z.object({ summary: z.string() }),
    area: ['design'],
    dataClass: 'schema',
    requires,
    execute,
  })

  test('it is not executed, the model is told, and the turn goes on', async () => {
    const hiddenRun = jest.fn(async () => ({ leaked: true }))
    const hidden = makeTool('test_hidden', () => false, hiddenRun)
    const offered = makeTool(
      'test_offered',
      () => true,
      async () => ({ ok: true })
    )
    const outputs = [() => toolCallStream('call-1', 'test_hidden', { summary: 'x' }), () => textStream('Sorry.')]
    let call = 0
    const model = new MockLanguageModelV4({ doStream: async () => ({ stream: outputs[Math.min(call++, 1)]() }) as any })
    const result = await runAssistantTurn({
      conversation: createConversation({ userUuid: 'user-1', surveyId: 7, area: 'design' }),
      userMessage: 'Do it',
      area: 'design',
      ctx: createToolContext(),
      access: { effective: { schema: 'cloud', data: 'off' } as any, hostingClass: 'cloud' },
      onUpdate: () => undefined,
      signal: new AbortController().signal,
      model,
      systemPrompt: 'SYSTEM',
      tools: [offered, hidden],
    } as any)
    const answer = result.messages.at(-1) as AssistantMessage
    expect(hiddenRun).not.toHaveBeenCalled()
    expect(answer.status).toBe('done')
    expect(answer.parts[0]).toMatchObject({
      type: 'tool',
      toolName: 'test_hidden',
      state: 'failed',
      output: { error: { code: 'toolFailed', message: expect.stringContaining('unavailable tool') } },
    })
    expect((model.doStreamCalls[0].tools ?? []).map((tool: any) => tool.name)).toEqual(['test_offered'])
    // the model gets the refusal in the next step
    expect(JSON.stringify(model.doStreamCalls[1].prompt)).toContain('unavailable tool')
  })
})
