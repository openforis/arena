import { jsonSchema, stepCountIs, streamText } from 'ai'

import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { createMockModel } from '@server/modules/ai/service/mockProvider'
import { MOCK_SCRIPTS, getScriptedStep } from '@server/modules/ai/service/mockScripts'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'

const system = (text: string): any => ({ role: 'system', content: text })
const user = (text: string): any => ({ role: 'user', content: [{ type: 'text', text }] })
const toolCall = (id: string): any => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName: 'nodeDef_get', input: {} }],
})
const toolResult = (id: string): any => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName: 'nodeDef_get', output: { type: 'json', value: {} } }],
})

const designSystem = system(`${assistantMarkers.design}\nYou are the design assistant.`)

describe('getScriptedStep', () => {
  test("no assistant marker: null, A's canned answers apply", async () => {
    expect(getScriptedStep([system('Generate an <expression>'), user('label')])).toBeNull()
    const result: any = await createMockModel().doGenerate({ prompt: [system('Reply with <expression>')] } as any)
    expect(result.content[0].text).toMatch(/^<expression>/)
  })

  test('the step index is the number of tool results after the last user message', () => {
    const start = [designSystem, user('Change the label of cluster_id')]
    expect(getScriptedStep(start)).toEqual({ toolCall: { toolName: 'nodeDef_get', input: { name: 'cluster_id' } } })
    expect(getScriptedStep([...start, toolCall('a'), toolResult('a')])).toMatchObject({
      toolCall: { toolName: 'labels_proposeSet' },
    })
    expect(getScriptedStep([...start, toolCall('a'), toolResult('a'), toolCall('b'), toolResult('b')])).toEqual({
      text: 'MOCK: I proposed a new label for `cluster_id`. Review the card and click Apply.',
    })
  })

  test('tool results of earlier turns do not count', () => {
    const prompt = [designSystem, user('Change the label'), toolCall('a'), toolResult('a'), user('Again the label')]
    expect(getScriptedStep(prompt)).toMatchObject({ toolCall: { toolName: 'nodeDef_get' } })
  })

  test("a marked prompt without a script never gets A's canned answers", () => {
    const helpSystem = system(`${assistantMarkers.help}\nManual outline:\n7 Data Explorer`)
    expect(getScriptedStep([helpSystem, user('What is a cycle?')])).toEqual({ text: 'MOCK answer.' })
  })
})

describe('createMockModel with scripts', () => {
  test('doGenerate returns the scripted tool call', async () => {
    const result: any = await createMockModel().doGenerate({ prompt: [designSystem, user('Add remarks')] } as any)
    expect(result.finishReason.unified).toBe('tool-calls')
    expect(result.content[0]).toMatchObject({ type: 'tool-call', toolName: 'nodeDef_proposeCreate' })
    expect(JSON.parse(result.content[0].input).nodeDefs[0].name).toBe('cluster_remarks')
  })

  test('a fixed text still wins', async () => {
    const result: any = await createMockModel({ text: 'fixed' }).doGenerate({
      prompt: [designSystem, user('label')],
    } as any)
    expect(result.content[0].text).toBe('fixed')
  })

  test('the whole turn through streamText: two tool calls, then the text', async () => {
    const calls: string[] = []
    const tool = (name: string, output: unknown) => ({
      description: name,
      inputSchema: jsonSchema({ type: 'object' }),
      execute: async () => {
        calls.push(name)
        return output
      },
    })
    const result = streamText({
      model: createMockModel(),
      system: `${assistantMarkers.design}\nRules.`,
      messages: [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
        { role: 'user', content: 'Change the label of cluster_id' },
      ],
      tools: {
        nodeDef_get: tool('nodeDef_get', { name: 'cluster_id' }),
        labels_proposeSet: tool('labels_proposeSet', { changeSetId: 'cs-1' }),
      } as any,
      stopWhen: stepCountIs(10),
      maxRetries: 0,
    })
    expect(await result.text).toBe('MOCK: I proposed a new label for `cluster_id`. Review the card and click Apply.')
    expect(calls).toEqual(['nodeDef_get', 'labels_proposeSet'])
  })
})

describe('MOCK_SCRIPTS', () => {
  test('every scripted tool call is a valid input of its D1 tool', () => {
    for (const script of MOCK_SCRIPTS) {
      for (const step of script.steps) {
        if (!('toolCall' in step)) continue
        const tool = ALL_TOOLS.find((candidate) => candidate.name === step.toolCall.toolName)
        expect([step.toolCall.toolName, Boolean(tool)]).toEqual([step.toolCall.toolName, true])
        const parsed = tool!.inputSchema.safeParse(step.toolCall.input)
        expect([step.toolCall.toolName, parsed.success]).toEqual([step.toolCall.toolName, true])
      }
    }
  })
})
