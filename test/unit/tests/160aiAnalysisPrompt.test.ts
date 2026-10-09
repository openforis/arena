import * as Survey from '@core/survey/survey'

import { buildAssistantAnalysisPrompt } from '@common/ai/prompts/assistantAnalysis'
import { buildDataQueryGeneratePrompt } from '@common/ai/prompts/dataQueryGenerate'

import * as DataTest from '../../utils/dataTest'
import { getContextUser } from '../../integration/config/context'

// keep in sync with CANNED_ANSWERS in server/modules/ai/service/mockProvider.ts
const cannedAnswerPatterns = [
  /<expression>/,
  /translate survey labels/i,
  /names data queries/i,
  /builds data queries/i,
  /activity log/i,
]

let survey: any = null
const cycle = Survey.cycleOneKey

const build = (dataToolsAvailable: boolean) =>
  buildAssistantAnalysisPrompt({
    survey,
    cycle,
    lang: 'en',
    uiLang: 'es',
    viewDescription: 'Explorer',
    dataToolsAvailable,
  })

beforeAll(async () => {
  survey = await DataTest.createTestSurvey({ user: getContextUser() })
})

describe('analysis system prompt', () => {
  test('contains the workflow, the query rules and the examples', () => {
    const prompt = build(false)
    for (const text of ['query_listEntities', 'category_findItems', 'query_propose', 'invalidProposal']) {
      expect(prompt).toContain(text)
    }
    expect(prompt).toContain('A query always targets ONE entity')
    expect(prompt).toContain('avg, cnt, max, med, min, sum')
    expect(prompt).toContain('Schema rules (the schema is returned by query_listEntities):')
    expect(prompt).not.toContain('given in the user message')
    expect(prompt).toContain('{"entity":"tree","mode":"aggregate"')
    expect(prompt).toMatch(/Answer in Spanish/)
    expect(prompt).toContain('Current view: "Explorer"')
    expect(prompt.startsWith('[arena-assistant:analysis]')).toBe(true)
  })

  test('without data tools the model is told it cannot see results', () => {
    const prompt = build(false)
    expect(prompt).toContain('You cannot see any result')
    expect(prompt).toContain('Open in Explorer')
    expect(prompt).not.toContain('query_run')
    expect(prompt).not.toContain('query_count')
  })

  test('with data tools: results only after query_run, aggregates, cited query ids', () => {
    const prompt = build(true)
    expect(prompt).toContain('query_run')
    expect(prompt).toContain('never from raw samples')
    expect(prompt).toContain('"query q1"')
    expect(prompt).not.toContain('You cannot see any result')
  })

  test('never matches a canned mock answer', () => {
    for (const prompt of [build(false), build(true)]) {
      for (const pattern of cannedAnswerPatterns) {
        expect(prompt).not.toMatch(pattern)
      }
    }
  })

  test("A's query generation prompt keeps its text", () => {
    const { system } = buildDataQueryGeneratePrompt({ survey, cycle, lang: 'en', description: 'trees by type' })
    expect(
      system.startsWith('You are an assistant that builds data queries for the Data Explorer of Open Foris Arena,')
    ).toBe(true)
    expect(system).toContain('Schema rules (the schema is given in the user message):')
    expect(system).toContain('Reply with EXACTLY one JSON object, nothing else')
    expect(system.endsWith('"explanation":"Averages the DBH of the trees with DBH > 10 for each plot."}')).toBe(true)
  })
})
