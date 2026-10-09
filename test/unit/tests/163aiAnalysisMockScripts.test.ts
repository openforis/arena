import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { toQuery } from '@common/ai/tasks/dataQuery'

import { assistantAnalysisMockScripts, formatMockQueryAnswer } from '@server/modules/ai/service/mockScriptsAnalysis'
import { getScriptedStep } from '@server/modules/ai/service/mockScripts'
import { proposeQueryInputSchema, toDataQueryAiResult } from '@webapp/ai/tools/analysis/proposeQuery'
import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'

import * as SB from '../../utils/surveyBuilder'

// the patterns of CANNED_ANSWERS in server/modules/ai/service/mockProvider.ts
const cannedAnswerPatterns = [
  /<expression>/,
  /translate survey labels/i,
  /names data queries/i,
  /builds data queries/i,
  /activity log/i,
]

// the user messages typed by test/e2e/specs/aiAnalysis.spec.ts
const e2eMessages = {
  propose: 'average of tree_dec_1 by cluster_id',
  run: 'run the average of tree_dec_1 by cluster_id',
}

const user = { uuid: 'test-ai-analysis-mock-scripts-user' }

// the e2e sample survey (test/e2e/fixtures/seed/sampleSurveyModel.ts), reduced to the attributes the scripts use
const buildSurvey = async () =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.entity(
          'tree',
          SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_dec_1', NodeDef.nodeDefType.decimal)
        ).multiple()
      ).multiple()
    )
  ).build()

const findScript = (message: string) => assistantAnalysisMockScripts.filter((script) => script.pattern.test(message))

const toolCalls = (script: any) => script.steps.filter((step: any) => step.toolCall).map((step: any) => step.toolCall)

describe('analysis mock scripts', () => {
  test('each e2e message matches exactly one script', () => {
    expect(findScript(e2eMessages.propose)).toHaveLength(1)
    expect(findScript(e2eMessages.run)).toHaveLength(1)
    expect(findScript(e2eMessages.propose)[0]).not.toBe(findScript(e2eMessages.run)[0])
    for (const script of assistantAnalysisMockScripts) expect(script.promptMarker).toBe(assistantMarkers.analysis)
  })

  test('the e2e messages never trigger a canned answer', () => {
    for (const message of Object.values(e2eMessages)) {
      for (const pattern of cannedAnswerPatterns) expect(pattern.test(message)).toBe(false)
    }
  })

  test('the proposed query is valid on the e2e survey', async () => {
    const survey = await buildSurvey()
    for (const script of assistantAnalysisMockScripts) {
      const [propose] = toolCalls(script)
      expect(propose.toolName).toBe('query_propose')
      const input = proposeQueryInputSchema.parse(propose.input)
      const { query, errors } = toQuery({
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        aiResult: toDataQueryAiResult(input) as any,
      })
      expect(errors).toEqual([])
      expect(query).toBeTruthy()
    }
  })

  test('the run script runs the proposed query, then answers from its rows', () => {
    const [script] = findScript(e2eMessages.run)
    expect(toolCalls(script).map((call: any) => call.toolName)).toEqual(['query_propose', 'query_run'])
    expect(toolCalls(script)[1].input).toEqual({ queryId: 'q1' })
    const last = script.steps.at(-1) as any
    const output = {
      queryId: 'q1',
      mode: 'aggregate',
      columns: ['cluster_id', 'tree_dec_1_avg'],
      rows: [
        [1, '30.5000000000000000'],
        [2, 31.5],
        [3, '32.5'],
      ],
      total: 3,
      truncated: false,
    }
    expect(last.text({ lastToolOutput: output })).toBe(
      'Average of tree_dec_1 by cluster_id (query q1): 1: 30.5; 2: 31.5; 3: 32.5.'
    )
  })

  test('the answer of a failed run says so', () => {
    expect(formatMockQueryAnswer({ error: { code: 'queryTimeout', message: 'too slow' } })).toMatch(/could not run/i)
    expect(formatMockQueryAnswer(null)).toMatch(/could not run/i)
  })

  test('the propose script only proposes and sends the user to the card', () => {
    const [script] = findScript(e2eMessages.propose)
    expect(toolCalls(script).map((call: any) => call.toolName)).toEqual(['query_propose'])
    const last = script.steps.at(-1) as any
    expect(typeof last.text).toBe('string')
    expect(last.text).toMatch(/Open in Explorer/)
  })

  test("D1's runner plays the scripts and answers from the last tool output", () => {
    const systemMessage = { role: 'system', content: `${assistantMarkers.analysis}\nRules.` }
    const userMessage = { role: 'user', content: [{ type: 'text', text: e2eMessages.run }] }
    const call = (id: string, toolName: string) => ({
      role: 'assistant',
      content: [{ type: 'tool-call', toolCallId: id, toolName, input: {} }],
    })
    const result = (id: string, toolName: string, value: unknown) => ({
      role: 'tool',
      content: [{ type: 'tool-result', toolCallId: id, toolName, output: { type: 'json', value } }],
    })
    const proposed: any[] = [
      systemMessage,
      userMessage,
      call('a', 'query_propose'),
      result('a', 'query_propose', { queryId: 'q1' }),
    ]
    expect(getScriptedStep(proposed)).toEqual({ toolCall: { toolName: 'query_run', input: { queryId: 'q1' } } })
    const ran = [...proposed, call('b', 'query_run'), result('b', 'query_run', { queryId: 'q1', rows: [[1, '30.5']] })]
    expect(getScriptedStep(ran)).toEqual({ text: 'Average of tree_dec_1 by cluster_id (query q1): 1: 30.5.' })
  })
})
