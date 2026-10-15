import {
  createOpenConversations,
  getOpenConversationsKey,
  parseOpenConversations,
  type OpenConversationsStorage,
} from '@webapp/ai/conversations/openConversations'

const noLog = () => undefined

const fakeStorage = () => {
  const items = new Map<string, string>()
  const storage: OpenConversationsStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value)
    },
    removeItem: (key) => {
      items.delete(key)
    },
  }
  return { items, storage }
}

const blockedStorage: OpenConversationsStorage = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('SecurityError')
  },
  removeItem: () => {
    throw new Error('SecurityError')
  },
}

const design7 = { userUuid: 'u1', surveyId: 7, area: 'design' }

describe('open conversations (200)', () => {
  test('the key is per user', () => {
    expect(getOpenConversationsKey('u1')).toBe('arena.ai.openConversations.u1')
  })

  test('set, get and remove per user, survey and area', () => {
    const { items, storage } = fakeStorage()
    const open = createOpenConversations({ getStorage: () => storage, log: noLog })
    open.set({ ...design7, conversationId: 'c-design' })
    open.set({ userUuid: 'u1', surveyId: 7, area: 'analysis', conversationId: 'c-analysis' })
    open.set({ userUuid: 'u1', surveyId: 8, area: 'design', conversationId: 'c-design-8' })
    expect(open.get(design7)).toBe('c-design')
    expect(open.get({ userUuid: 'u1', surveyId: 8, area: 'design' })).toBe('c-design-8')
    expect(open.get({ userUuid: 'u1', surveyId: 7, area: 'cleaning' })).toBeNull()
    expect(JSON.parse(items.get('arena.ai.openConversations.u1')!)).toEqual({
      '7': { design: 'c-design', analysis: 'c-analysis' },
      '8': { design: 'c-design-8' },
    })

    open.set({ userUuid: 'u1', surveyId: 8, area: 'design', conversationId: null })
    expect(open.get({ userUuid: 'u1', surveyId: 8, area: 'design' })).toBeNull()
    expect(JSON.parse(items.get('arena.ai.openConversations.u1')!)).toEqual({
      '7': { design: 'c-design', analysis: 'c-analysis' },
    })
  })

  test('Help without a survey uses the help entry', () => {
    const { items, storage } = fakeStorage()
    const open = createOpenConversations({ getStorage: () => storage, log: noLog })
    open.set({ userUuid: 'u1', surveyId: null, area: 'help', conversationId: 'c-help' })
    expect(open.get({ userUuid: 'u1', surveyId: null, area: 'help' })).toBe('c-help')
    expect(open.get({ userUuid: 'u1', surveyId: 7, area: 'help' })).toBeNull()
    expect(JSON.parse(items.get('arena.ai.openConversations.u1')!)).toEqual({ help: { help: 'c-help' } })
  })

  test('another user key is never read, and clear removes only the user key', () => {
    const { items, storage } = fakeStorage()
    const open = createOpenConversations({ getStorage: () => storage, log: noLog })
    open.set({ ...design7, conversationId: 'c-u1' })
    open.set({ ...design7, userUuid: 'u2', conversationId: 'c-u2' })
    expect(open.get({ ...design7, userUuid: 'u2' })).toBe('c-u2')
    expect(open.get({ ...design7, userUuid: 'u3' })).toBeNull()

    open.clear('u1')
    expect(open.get(design7)).toBeNull()
    expect(items.has('arena.ai.openConversations.u1')).toBe(false)
    expect(open.get({ ...design7, userUuid: 'u2' })).toBe('c-u2')
  })

  test('blocked or missing storage: works from memory', () => {
    for (const getStorage of [() => blockedStorage, () => null]) {
      const open = createOpenConversations({ getStorage, log: noLog })
      open.set({ ...design7, conversationId: 'c1' })
      expect(open.get(design7)).toBe('c1')
      open.clear('u1')
      expect(open.get(design7)).toBeNull()
    }
  })

  test('a failed write (quota) keeps the new value in memory', () => {
    const { storage } = fakeStorage()
    const open = createOpenConversations({ getStorage: () => storage, log: noLog })
    open.set({ ...design7, conversationId: 'c1' })
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    open.set({ ...design7, conversationId: 'c2' })
    // not the stale c1 still in the storage
    expect(open.get(design7)).toBe('c2')
  })

  test('corrupt or foreign stored values are ignored (review focus 4)', () => {
    for (const raw of [
      null,
      '',
      'not json',
      '[1,2]',
      '"text"',
      'null',
      '{"7": "c1"}',
      '{"7": {"design": 42, "help": ""}}',
    ]) {
      expect(parseOpenConversations(raw)).toEqual({})
    }
    expect(parseOpenConversations('{"7": {"design": "c1", "help": 3}, "8": []}')).toEqual({ '7': { design: 'c1' } })

    const { items, storage } = fakeStorage()
    items.set('arena.ai.openConversations.u1', '{oops')
    const open = createOpenConversations({ getStorage: () => storage, log: noLog })
    expect(open.get(design7)).toBeNull()
    open.set({ ...design7, conversationId: 'c1' })
    expect(JSON.parse(items.get('arena.ai.openConversations.u1')!)).toEqual({ '7': { design: 'c1' } })
  })
})
