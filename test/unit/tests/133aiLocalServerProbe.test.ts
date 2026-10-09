import {
  DEFAULT_LOCAL_CONTEXT_TOKENS,
  getLocalServerLimits,
  LOCAL_SERVER_MAX_STEPS,
  parseLmStudioContextTokens,
  parseLocalServerModelIds,
  probeLocalServer,
} from '@webapp/ai/engines/localServerProbe'

const BASE_URL = 'http://localhost:1234/v1'

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })

const modelsBody = { object: 'list', data: [{ id: 'local-model' }, { id: 'other-model' }, { id: 'text-embedding-x' }] }
const lmStudioBody = {
  data: [
    { id: 'local-model', type: 'llm', state: 'loaded', loaded_context_length: 4096, max_context_length: 131072 },
    { id: 'other-model', type: 'llm', state: 'not-loaded', max_context_length: 32768 },
    { id: 'text-embedding-x', type: 'embeddings', max_context_length: 2048 },
  ],
}

const routes = (table: Record<string, () => Response | Promise<Response>>) => {
  const calls: string[] = []
  const fetchImpl = async (url: string) => {
    calls.push(url)
    const handler = table[url]
    if (!handler) throw new TypeError('Failed to fetch')
    return handler()
  }
  return { calls, fetchImpl }
}

describe('limits', () => {
  test('context × 3 chars × 0.75, 6 steps', () => {
    expect(getLocalServerLimits(4096)).toEqual({ maxPromptChars: 9216, maxSteps: 6 })
    expect(getLocalServerLimits(null)).toEqual({ maxPromptChars: 18432, maxSteps: LOCAL_SERVER_MAX_STEPS })
    expect(DEFAULT_LOCAL_CONTEXT_TOKENS).toBe(8192)
  })
})

describe('parsing', () => {
  test('model ids from GET /models (deduplicated, strings only)', () => {
    expect(
      parseLocalServerModelIds({ data: [{ id: 'a' }, { id: 'a' }, { id: 3 }, null, { id: ' ' }, { id: 'b' }] })
    ).toEqual(['a', 'b'])
    expect(parseLocalServerModelIds({})).toEqual([])
    expect(parseLocalServerModelIds(null)).toEqual([])
  })

  test('LM Studio context: loaded length, else max length, else null', () => {
    expect(parseLmStudioContextTokens(lmStudioBody, 'local-model')).toBe(4096)
    expect(parseLmStudioContextTokens(lmStudioBody, 'other-model')).toBe(32768)
    expect(parseLmStudioContextTokens(lmStudioBody, 'missing')).toBeNull()
    expect(parseLmStudioContextTokens({ data: [{ id: 'm', loaded_context_length: -1 }] }, 'm')).toBeNull()
    expect(parseLmStudioContextTokens('nope', 'm')).toBeNull()
  })
})

describe('probeLocalServer', () => {
  test('LM Studio: models (without embedding models) and the loaded context of the chosen model', async () => {
    const { calls, fetchImpl } = routes({
      'http://localhost:1234/v1/models': () => json(200, modelsBody),
      'http://localhost:1234/api/v0/models': () => json(200, lmStudioBody),
    })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: 'local-model', fetchImpl })
    expect(result).toEqual({
      reachable: true,
      models: ['local-model', 'other-model'],
      contextTokens: 4096,
      error: null,
    })
    expect(calls).toEqual(['http://localhost:1234/v1/models', 'http://localhost:1234/api/v0/models'])
  })

  test('no model chosen: the context of the first model', async () => {
    const { fetchImpl } = routes({
      'http://localhost:1234/v1/models': () => json(200, modelsBody),
      'http://localhost:1234/api/v0/models': () => json(200, lmStudioBody),
    })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: null, fetchImpl })
    expect(result.contextTokens).toBe(4096)
  })

  test('another OpenAI-compatible server: no LM Studio endpoint, context unknown (8,192 used for the limits)', async () => {
    const { fetchImpl } = routes({ 'http://localhost:1234/v1/models': () => json(200, modelsBody) })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: 'local-model', fetchImpl })
    expect(result).toEqual({
      reachable: true,
      models: ['local-model', 'other-model', 'text-embedding-x'],
      contextTokens: null,
      error: null,
    })
  })

  test('server down: unreachable with the URL', async () => {
    const { fetchImpl } = routes({})
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: 'local-model', fetchImpl })
    expect(result).toEqual({
      reachable: false,
      models: [],
      contextTokens: null,
      error: { key: 'aiLocalServerUnreachable', params: { baseUrl: BASE_URL } },
    })
  })

  test('wrong path: HTTP error with the status', async () => {
    const { fetchImpl } = routes({ 'http://localhost:1234/v1/models': () => json(404, {}) })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: null, fetchImpl })
    expect(result.reachable).toBe(false)
    expect(result.error).toEqual({ key: 'aiLocalServerError', params: { status: 404 } })
  })

  test('times out after timeoutMs', async () => {
    const fetchImpl = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: null, fetchImpl, timeoutMs: 20 })
    expect(result.reachable).toBe(false)
    expect(result.error?.key).toBe('aiLocalServerUnreachable')
  })

  test('a malformed models body counts as reachable with no models', async () => {
    const { fetchImpl } = routes({ 'http://localhost:1234/v1/models': () => new Response('not json', { status: 200 }) })
    const result = await probeLocalServer({ baseUrl: BASE_URL, modelId: null, fetchImpl })
    expect(result).toEqual({ reachable: true, models: [], contextTokens: null, error: null })
  })
})
