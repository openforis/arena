import { IDBFactory } from 'fake-indexeddb'

import { createConversation } from '@webapp/ai/conversations/conversationModel'
import { openConversationStore } from '@webapp/ai/conversations/conversationStore'
import { createOpenConversations, type OpenConversationsStorage } from '@webapp/ai/conversations/openConversations'
import { loadLocalProviders, saveLocalProviders } from '@webapp/ai/engines/localProviders'
import { createResetAiSession } from '@webapp/ai/session/resetAiSession'
import { createSuggestionStore } from '@webapp/ai/suggestions/suggestionStore'
import type { AssistantSuggestion, SuggestionRequest } from '@webapp/ai/suggestions/types'
import { createAssistantLogout } from '@webapp/components/ai/Assistant/assistantLogout'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import { createAssistantTurnRegistry } from '@webapp/components/ai/Assistant/assistantTurnRegistry'
import { createAuthSession } from '@webapp/store/login/authSession'

const noLog = () => undefined

describe('AI session reset (421)', () => {
  test('the assistant is reset first, then every cache in order', async () => {
    const calls: string[] = []
    const reset = createResetAiSession({
      resetAssistant: async () => {
        await Promise.resolve()
        calls.push('assistant')
      },
      resets: [
        { name: 'one', run: () => void calls.push('one') },
        { name: 'two', run: async () => void calls.push('two') },
      ],
      log: noLog,
    })
    await reset()
    expect(calls).toEqual(['assistant', 'one', 'two'])
  })

  test('a reset that fails is logged and the others still run (login and logout never fail on it)', async () => {
    const calls: string[] = []
    const log = jest.fn()
    const reset = createResetAiSession({
      resetAssistant: async () => {
        throw new Error('assistant')
      },
      resets: [
        {
          name: 'broken',
          run: () => {
            throw new Error('broken')
          },
        },
        { name: 'fine', run: () => void calls.push('fine') },
      ],
      log,
    })
    await expect(reset()).resolves.toBeUndefined()
    expect(calls).toEqual(['fine'])
    expect(log).toHaveBeenCalledTimes(2)
  })
})

describe('auth session (421)', () => {
  const createDeps = (requestLogout: () => Promise<unknown>) => {
    const calls: string[] = []
    return {
      calls,
      session: createAuthSession({
        requestLogout: async () => {
          calls.push('POST /auth/logout')
          return requestLogout()
        },
        setAuthToken: (token) => void calls.push(`token ${token}`),
        resetAiSession: async () => void calls.push('reset AI'),
      }),
    }
  }

  test('login sets the token and resets the AI state of the previous session', async () => {
    const { calls, session } = createDeps(async () => undefined)
    await session.begin('abc')
    expect(calls).toEqual(['token abc', 'reset AI'])
  })

  test('logout asks the server, then drops the token and resets the AI state', async () => {
    const { calls, session } = createDeps(async () => undefined)
    await session.end()
    expect(calls).toEqual(['POST /auth/logout', 'token null', 'reset AI'])
  })

  test('logout drops the token and resets the AI state even when POST /auth/logout fails', async () => {
    const { calls, session } = createDeps(async () => {
      throw new Error('Network Error')
    })
    await expect(session.end()).resolves.toBeUndefined()
    expect(calls).toEqual(['POST /auth/logout', 'token null', 'reset AI'])
  })
})

describe('another user on the same browser (421)', () => {
  const suggestion: AssistantSuggestion = {
    id: 'missingTranslations:fr',
    kind: 'missingTranslations',
    area: 'design',
    surveyId: 7,
    cycle: null,
    targets: [{ key: 'a:labels' }],
    createdAt: '2026-10-11T10:00:00.000Z',
    expiresAt: null,
  }

  /** One browser: a localStorage and an IndexedDB shared by every user, and the stores built on them. */
  const createBrowser = async () => {
    const data = new Map<string, string>()
    const localStorage: OpenConversationsStorage = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => void data.set(key, value),
      removeItem: (key) => void data.delete(key),
      key: (index) => [...data.keys()][index] ?? null,
      get length() {
        return data.size
      },
    }
    const conversations = await openConversationStore({ indexedDB: new IDBFactory() as unknown as IDBFactory })
    const openConversations = createOpenConversations({ getStorage: () => localStorage, log: noLog })
    const suggestions = createSuggestionStore({
      access: { getStorage: () => localStorage, addStorageListener: () => () => undefined },
      log: noLog,
    })
    const panel = createAssistantPanelStore({ openConversations })
    const registry = createAssistantTurnRegistry()
    const resetAiSession = createResetAiSession({
      resetAssistant: createAssistantLogout({
        abortTurns: () => registry.abortAll(),
        settleSaves: () => registry.settle(),
        resetPanel: () => panel.reset(),
      }),
      resets: [],
      log: noLog,
    })
    return { localStorage, conversations, openConversations, suggestions, panel, resetAiSession }
  }

  test('a second user sees nothing of the first one, who finds everything back on the next login', async () => {
    const browser = await createBrowser()
    const { localStorage, conversations, openConversations, suggestions, panel } = browser

    // user A works: a conversation that held record data, its open id, a suggestion, a local provider
    const conversation = {
      ...createConversation({ userUuid: 'A', surveyId: 7, area: 'analysis', idFactory: () => 'conversation-a' }),
      dataClass: 'data' as const,
    }
    await conversations.save(conversation)
    panel.setScope({ userUuid: 'A', surveyId: 7 })
    // a Do it of A waiting for the chat to send it
    panel.startWithPrompt({ requestId: 'r1', userUuid: 'A', surveyId: 7, area: 'analysis' } as SuggestionRequest)
    panel.setConversationId(conversation.id)
    suggestions.add({ userUuid: 'A', suggestion })
    suggestions.markModuleSeen({ userUuid: 'A', module: 'designer' })
    saveLocalProviders({
      storage: localStorage,
      userUuid: 'A',
      providers: [{ id: 'local:a1', name: 'Mine', baseUrl: 'http://localhost:1234/v1', modelId: null }],
    })

    await browser.resetAiSession() // logout of A

    // user B logs in on the same browser
    panel.setScope({ userUuid: 'B', surveyId: 7 })
    panel.setArea('analysis')
    expect(panel.getState().conversationId).toBeNull()
    expect(panel.getState().pendingRequest).toBeNull()
    expect(await conversations.list({ userUuid: 'B', surveyId: 7 })).toEqual([])
    expect(await conversations.get(conversation.id, 'B')).toBeNull()
    expect(openConversations.get({ userUuid: 'B', surveyId: 7, area: 'analysis' })).toBeNull()
    expect(suggestions.getPending({ userUuid: 'B', surveyId: 7 })).toEqual([])
    expect(suggestions.isModuleSeen({ userUuid: 'B', module: 'designer' })).toBe(false)
    expect(loadLocalProviders({ storage: localStorage, userUuid: 'B' })).toEqual([])

    await browser.resetAiSession() // logout of B

    // A logs in again: the conversations stay in the browser until the user clears them
    panel.setScope({ userUuid: 'A', surveyId: 7 })
    panel.setArea('analysis')
    expect(panel.getState().conversationId).toBe(conversation.id)
    expect((await conversations.get(conversation.id, 'A'))?.dataClass).toBe('data')
    expect(suggestions.getPending({ userUuid: 'A', surveyId: 7 })).toHaveLength(1)
    expect(loadLocalProviders({ storage: localStorage, userUuid: 'A' })).toHaveLength(1)
  })
})
