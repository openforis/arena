import en from '@core/i18n/resources/en'
import { assistantMarkers } from '@common/ai/prompts/assistantMarkers'
import { buildAssistantCleaningPrompt } from '@common/ai/prompts/assistantCleaning'
import { buildRowContextDraft, cleaningRowContextMarker, parseRowContext } from '@common/ai/prompts/cleaningRowContext'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { escalateConversationDataClass } from '@webapp/ai/conversations/dataClass'
import { normalizeLoadedConversation } from '@webapp/components/ai/Assistant/assistantPanelModel'
import { ALL_TOOLS } from '@webapp/ai/tools/allTools'
import { analysisTools } from '@webapp/ai/tools/analysis'
import { createCleaningTools } from '@webapp/ai/tools/cleaning'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import { pickArea, type AssistantAreaStatus } from '@webapp/components/ai/Assistant/assistantAreas'
import {
  getCleaningAreaStatus,
  isCleaningRoute,
  startsAsDataConversation,
} from '@webapp/components/ai/Assistant/cleaning/cleaningArea'

import {
  assistantCleaningMockScripts,
  formatMockProposalAnswer,
  MOCK_FIXED_VALUE,
  proposeRowFixInput,
} from '@server/modules/ai/service/mockScriptsCleaning'
import { createMockModel } from '@server/modules/ai/service/mockProvider'

import { cleaningTestSurvey, fakeI18n, newFakeCleaningApi } from '@test/unit/utils/aiCleaningTestUtils'

const available = { status: 'available' } as any
const hidden = { area: 'cleaning', status: 'hidden', reasonKeys: [] }

describe('cleaning area', () => {
  test('routes: validation report, record editor, explorer in edit mode', () => {
    expect(isCleaningRoute({ pathname: '/app/data/validationReport/', explorerEditMode: false })).toBe(true)
    expect(isCleaningRoute({ pathname: '/app/data/recordValidationReport/r-1', explorerEditMode: false })).toBe(true)
    expect(isCleaningRoute({ pathname: '/app/data/record/r-1', explorerEditMode: false })).toBe(true)
    expect(isCleaningRoute({ pathname: '/app/data/explorer/', explorerEditMode: true })).toBe(true)
    expect(isCleaningRoute({ pathname: '/app/data/explorer/', explorerEditMode: false })).toBe(false)
    expect(isCleaningRoute({ pathname: '/app/data/records/', explorerEditMode: false })).toBe(false)
  })

  test('status: hidden without survey, without cleanse permission or when disabled', () => {
    expect(getCleaningAreaStatus({ surveyOpen: false, canCleanseRecords: true, availability: available })).toEqual(
      hidden
    )
    expect(getCleaningAreaStatus({ surveyOpen: true, canCleanseRecords: false, availability: available })).toEqual(
      hidden
    )
    expect(
      getCleaningAreaStatus({ surveyOpen: true, canCleanseRecords: true, availability: { status: 'disabled' } as any })
    ).toEqual(hidden)
    expect(getCleaningAreaStatus({ surveyOpen: true, canCleanseRecords: true, availability: available })).toEqual({
      area: 'cleaning',
      status: 'available',
      reasonKeys: [],
    })
    const noEngine = { status: 'noEngine', reasonKeys: ['aiEngine.unavailable.localServerNotEnabled'] } as any
    // built with fromAvailability: it carries the engine availability when the engine reasons are present
    expect(getCleaningAreaStatus({ surveyOpen: true, canCleanseRecords: true, availability: noEngine })).toMatchObject({
      area: 'cleaning',
      status: 'unavailable',
      reasonKeys: ['aiEngine.unavailable.localServerNotEnabled'],
    })
    const withReasons = { status: 'noEngine', reasonKeys: ['x'], reasons: [{ key: 'x' }] } as any
    expect(
      getCleaningAreaStatus({ surveyOpen: true, canCleanseRecords: true, availability: withReasons }).engineAvailability
    ).toBe(withReasons)
  })

  describe('pickArea with a cleaning route', () => {
    const status = (area: any, value: AssistantAreaStatus['status'] = 'available'): AssistantAreaStatus => ({
      area,
      status: value,
      reasonKeys: [],
    })
    const statuses = [status('design'), status('analysis'), status('cleaning'), status('help')]
    const base = { statuses, module: 'data', analysisRoute: false, cleaningRoute: true }

    test('prefers cleaning on a cleaning route, also over the analysis route of the Explorer', () => {
      expect(pickArea({ ...base, current: null, panelOpen: false, userSelectedArea: null })).toBe('cleaning')
      expect(pickArea({ ...base, analysisRoute: true, current: null, panelOpen: false, userSelectedArea: null })).toBe(
        'cleaning'
      )
    })

    test('an open conversation keeps its area, a tab picked by the user wins', () => {
      expect(pickArea({ ...base, current: 'help', panelOpen: true, userSelectedArea: null })).toBe('help')
      expect(pickArea({ ...base, current: null, panelOpen: false, userSelectedArea: 'design' })).toBe('design')
    })

    test('falls back to analysis, then to the module area, when cleaning is not available', () => {
      const noCleaning = [status('design'), status('analysis'), status('cleaning', 'unavailable'), status('help')]
      const params = { ...base, statuses: noCleaning, current: null, panelOpen: false, userSelectedArea: null }
      expect(pickArea({ ...params, analysisRoute: true })).toBe('analysis')
      expect(pickArea(params)).toBe('help')
    })

    test('no cleaning route: unchanged', () => {
      expect(pickArea({ ...base, cleaningRoute: false, current: null, panelOpen: false, userSelectedArea: null })).toBe(
        'help'
      )
    })
  })

  test('openWithDraft opens the area as a user choice, in a new conversation, with the draft', () => {
    const store = createAssistantPanelStore()
    store.setConversationId('c1')
    store.openWithDraft({ area: 'cleaning', draft: 'Why?' })
    expect(store.getState()).toMatchObject({
      open: true,
      area: 'cleaning',
      userSelectedArea: 'cleaning',
      conversationId: null,
      view: 'chat',
      draft: 'Why?',
    })
    expect(store.getState().draftArea).toBe('cleaning')
    store.clearDraft()
    expect(store.getState().draft).toBeNull()
    expect(store.getState().draftArea).toBeNull()
  })

  test('a draft made for the cleaning area is dropped when another area is selected', () => {
    const store = createAssistantPanelStore()
    store.openWithDraft({ area: 'cleaning', draft: 'Why?' })
    store.setArea('cleaning')
    expect(store.getState().draft).toBe('Why?')
    store.setArea('help', { byUser: true })
    expect(store.getState()).toMatchObject({ draft: null, draftArea: null, area: 'help' })
  })

  test('a reopened cleaning conversation keeps its data class', () => {
    const conversation = {
      ...escalateConversationDataClass({
        conversation: createConversation({ userUuid: 'u', surveyId: 1, area: 'cleaning' }),
        dataClass: 'data',
      }),
    }
    expect(normalizeLoadedConversation(conversation).dataClass).toBe('data')
    const streaming = { ...conversation, messages: [{ id: 'm', role: 'assistant', status: 'streaming', parts: [] }] }
    expect(normalizeLoadedConversation(streaming as any).dataClass).toBe('data')
  })

  test('cleaning conversations start as data', () => {
    expect(startsAsDataConversation('cleaning')).toBe(true)
    expect(startsAsDataConversation('analysis')).toBe(false)
    expect(startsAsDataConversation('design')).toBe(false)
  })
})

describe('row context', () => {
  test('the draft carries the row and can be parsed back', () => {
    const draft = buildRowContextDraft({
      question: 'Why is this invalid?',
      context: {
        recordUuid: 'rec-1',
        recordKeys: '12',
        nodeUuid: 'node-1',
        path: 'cluster[12] / plot[1] / tree[2] / dbh',
        messages: ['Required value', 'Must be > 0'],
      },
    })
    expect(draft.startsWith('Why is this invalid?')).toBe(true)
    expect(draft).toContain(cleaningRowContextMarker)
    expect(draft).toContain('cluster[12] / plot[1] / tree[2] / dbh')
    expect(draft).toContain('Required value; Must be > 0')
    expect(parseRowContext(draft)).toEqual({ recordUuid: 'rec-1', nodeUuid: 'node-1' })
    expect(parseRowContext('no context here')).toBeNull()
  })
})

describe('cleaning prompt', () => {
  test('starts with the marker and describes the workflow', async () => {
    const survey = await cleaningTestSurvey()
    const prompt = buildAssistantCleaningPrompt({ survey, cycle: '0', lang: 'en', uiLang: 'fr' })
    expect(prompt.startsWith(assistantMarkers.cleaning)).toBe(true)
    expect(assistantMarkers.cleaning).toBe('[arena-assistant:cleaning]')
    for (const toolName of [
      'validation_summarize',
      'validation_list',
      'record_getValues',
      'records_proposeEdits',
      'query_run',
    ]) {
      expect(prompt).toContain(toolName)
    }
    expect(prompt).toContain('200')
    expect(prompt).toContain('"fr"')
    // phrases the mock provider's canned answers match must not appear (D1 dev. 8)
    for (const phrase of ['Data Explorer', '<expression>', 'translate survey labels', 'activity log']) {
      expect(prompt).not.toContain(phrase)
    }
  })
})

describe('cleaning tools', () => {
  test('four data tools of the cleaning area', () => {
    const tools = createCleaningTools({ api: newFakeCleaningApi().api, getI18n: () => fakeI18n })
    expect(tools.map((tool) => tool.name)).toEqual([
      'validation_summarize',
      'validation_list',
      'record_getValues',
      'records_proposeEdits',
    ])
    for (const tool of tools) {
      expect(tool).toMatchObject({ dataClass: 'data', area: ['cleaning'] })
    }
  })

  test('the cleaning tools are registered, once each', () => {
    const names = ALL_TOOLS.map((tool) => tool.name)
    for (const name of ['validation_summarize', 'validation_list', 'record_getValues', 'records_proposeEdits']) {
      expect(names.filter((candidate) => candidate === name)).toHaveLength(1)
    }
  })

  test('the shared D1 and D2 tools are offered in the cleaning area too', () => {
    const shared = [
      'survey_getOverview',
      'nodeDef_get',
      'nodeDef_search',
      'docs_search',
      'query_listEntities',
      'query_propose',
      'query_count',
      'query_run',
    ]
    // ALL_TOOLS already contains D2's analysisTools (D2 Task 10); the spread is harmless
    const allTools = [...ALL_TOOLS, ...analysisTools]
    for (const name of shared) {
      const tool = allTools.find((candidate) => candidate.name === name)
      expect({ name, areas: tool?.area }).toEqual({ name, areas: expect.arrayContaining(['cleaning']) })
    }
    // the other analysis tools stay Analysis-only
    for (const name of ['records_countByStep', 'records_countOverTime', 'category_findItems']) {
      expect(allTools.find((candidate) => candidate.name === name)?.area).toEqual(['analysis'])
    }
  })
})

describe('cleaning mock script', () => {
  const rowContext = {
    recordUuid: '5f1f0b9c-2a1e-4b8e-9d55-0d6c1d0a8e11',
    recordKeys: '1',
    nodeUuid: '9a3c2f4e-77b1-4f0a-8a51-3e9f6d2c4b22',
    path: 'Cluster[1] / Plot[1] / Tree[1] / Tree decimal 2',
    messages: ['tree_dec_2 > 10'],
  }
  // the message sent by the e2e spec: the en row-action question with the row context
  const e2eMessage = buildRowContextDraft({ question: en.common.aiCleaning.rowAction.question, context: rowContext })

  const findScripts = (message: string) => assistantCleaningMockScripts.filter((script) => script.pattern.test(message))

  test('the e2e message matches exactly one script, with the cleaning marker', () => {
    expect(findScripts(e2eMessage)).toHaveLength(1)
    for (const script of assistantCleaningMockScripts) expect(script.promptMarker).toBe(assistantMarkers.cleaning)
  })

  test('the tool input is built from the row context and is valid for records_proposeEdits', () => {
    const input = proposeRowFixInput({ lastUserMessage: e2eMessage, lastToolOutput: null })
    expect(input.edits).toEqual([
      { recordUuid: rowContext.recordUuid, nodeUuid: rowContext.nodeUuid, value: MOCK_FIXED_VALUE },
    ])
    const tool = createCleaningTools({ api: newFakeCleaningApi().api, getI18n: () => fakeI18n }).find(
      (candidate) => candidate.name === 'records_proposeEdits'
    )!
    expect(tool.inputSchema.safeParse(input).success).toBe(true)
    // without a row context the input is refused by the schema (no edit), never invented
    expect(proposeRowFixInput({ lastUserMessage: 'hello', lastToolOutput: null }).edits).toEqual([])
  })

  test('the answer reports the proposal or its failure', () => {
    expect(formatMockProposalAnswer({ changeSetId: 'cs1', proposed: 1, rejected: [], shownToUser: true })).toMatch(
      /proposed 1 edit/
    )
    expect(formatMockProposalAnswer({ error: { code: 'invalidProposal', message: 'x', issues: [] } })).toMatch(
      /could not/i
    )
    expect(formatMockProposalAnswer(null)).toMatch(/could not/i)
  })

  test('the mock model plays the script: the tool call input comes from the user message', async () => {
    const survey = await cleaningTestSurvey()
    const system = buildAssistantCleaningPrompt({ survey, cycle: '0', lang: 'en', uiLang: 'en' })
    const model = createMockModel()
    const result: any = await model.doGenerate({
      prompt: [
        { role: 'system', content: system },
        { role: 'user', content: [{ type: 'text', text: e2eMessage }] },
      ],
      tools: [
        {
          type: 'function',
          name: 'records_proposeEdits',
          description: 'x',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    } as any)
    const toolCall = result.content.find((part: any) => part.type === 'tool-call')
    expect(toolCall?.toolName).toBe('records_proposeEdits')
    const input = typeof toolCall.input === 'string' ? JSON.parse(toolCall.input) : toolCall.input
    expect(input.edits[0]).toMatchObject({ nodeUuid: rowContext.nodeUuid, value: MOCK_FIXED_VALUE })
  })
})
