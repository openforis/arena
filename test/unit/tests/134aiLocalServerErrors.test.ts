import {
  createLocalServerFetch,
  mapLocalServerFetchError,
  mapLocalServerHttpError,
  toEngineErrorInfo,
  withAddressSpace,
} from '@webapp/ai/engines/localServerErrors'
import { getAiErrorKey } from '@webapp/ai/runtime/runtimeErrors'

const BASE_URL = 'http://localhost:1234/v1'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('mapLocalServerHttpError', () => {
  test.each([
    [
      404,
      'POST',
      '{"error":{"message":"Model not found"}}',
      'aiLocalServerModelMissing',
      404,
      { modelId: 'local-model' },
    ],
    [404, 'GET', 'Not Found', 'aiLocalServerError', 404, { status: 404 }],
    [
      400,
      'POST',
      '{"error":{"message":"model local-model is not loaded"}}',
      'aiLocalServerModelMissing',
      404,
      { modelId: 'local-model' },
    ],
    [
      400,
      'POST',
      '{"error":{"message":"No models loaded. Please load a model first."}}',
      'aiLocalServerModelMissing',
      404,
      { modelId: 'local-model' },
    ],
    [
      400,
      'POST',
      '{"error":"The number of tokens to keep exceeds the context length"}',
      'aiLocalServerContextExceeded',
      413,
      {},
    ],
    [400, 'POST', '{"error":{"message":"Context size has been exceeded."}}', 'aiLocalServerContextExceeded', 413, {}],
    [400, 'POST', '{"error":{"message":"\'messages\' field is required"}}', 'aiLocalServerError', 400, { status: 400 }],
    [400, 'POST', '{"error":{"message":"max_tokens must be positive"}}', 'aiLocalServerError', 400, { status: 400 }],
    [500, 'POST', 'boom', 'aiLocalServerError', 500, { status: 500 }],
    [503, 'GET', '', 'aiLocalServerError', 503, { status: 503 }],
  ])('%i %s %s → %s', (status, method, bodyText, key, statusCode, params) => {
    const error = mapLocalServerHttpError({ status, bodyText, modelId: 'local-model', method })
    expect(error.key).toBe(key)
    expect(error.statusCode).toBe(statusCode)
    expect(error.params).toEqual(params)
  })

  test('a missing model id is shown as empty', () => {
    expect(mapLocalServerHttpError({ status: 404, bodyText: '', modelId: null, method: 'POST' }).params).toEqual({
      modelId: '',
    })
  })
})

describe('mapLocalServerFetchError', () => {
  test('a network error means unreachable', () => {
    const error = mapLocalServerFetchError({ error: new TypeError('Failed to fetch'), baseUrl: BASE_URL }) as any
    expect(error.key).toBe('aiLocalServerUnreachable')
    expect(error.params).toEqual({ baseUrl: BASE_URL })
    expect(error.statusCode).toBe(503)
  })

  test('a cancel is rethrown unchanged', () => {
    const abort = new DOMException('aborted', 'AbortError')
    expect(mapLocalServerFetchError({ error: abort, baseUrl: BASE_URL })).toBe(abort)
  })
})

describe('withAddressSpace', () => {
  test('adds targetAddressSpace for private addresses only', () => {
    expect(withAddressSpace({ method: 'GET' }, 'http://192.168.1.20:1234/v1/models')).toEqual({
      method: 'GET',
      redirect: 'error',
      targetAddressSpace: 'local',
    })
    expect(withAddressSpace({ method: 'GET' }, 'http://localhost:1234/v1/models')).toEqual({
      method: 'GET',
      redirect: 'error',
    })
  })
})

describe('createLocalServerFetch', () => {
  const recorder = (respond: () => Promise<Response>) => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetchImpl = async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      return respond()
    }
    return { calls, fetchImpl }
  }

  test('never follows redirects; a refused redirect is unreachable', async () => {
    const { calls, fetchImpl } = recorder(async () => {
      throw new TypeError('Failed to fetch')
    })
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: BASE_URL, modelId: 'local-model' })
    const error = await localFetch(`${BASE_URL}/chat/completions`, { method: 'POST' }).catch((e) => e)
    expect(calls[0].init?.redirect).toBe('error')
    expect(error.key).toBe('aiLocalServerUnreachable')
  })

  test('passes a successful response through', async () => {
    const { calls, fetchImpl } = recorder(async () => jsonResponse(200, { ok: true }))
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: BASE_URL, modelId: 'local-model' })
    const response = await localFetch(`${BASE_URL}/models`, { method: 'GET' })
    expect(await response.json()).toEqual({ ok: true })
    expect(calls[0].url).toBe('http://localhost:1234/v1/models')
  })

  test('accepts URL objects and adds the address space for LAN servers', async () => {
    const { calls, fetchImpl } = recorder(async () => jsonResponse(200, {}))
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: 'http://10.0.0.5:8000/v1', modelId: null })
    await localFetch(new URL('http://10.0.0.5:8000/v1/models'))
    expect(calls[0].url).toBe('http://10.0.0.5:8000/v1/models')
    expect((calls[0].init as any).targetAddressSpace).toBe('local')
  })

  test('the server stopped: unreachable, readable by the A error helpers', async () => {
    const { fetchImpl } = recorder(async () => {
      throw new TypeError('Failed to fetch')
    })
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: BASE_URL, modelId: 'local-model' })
    const error = await localFetch(`${BASE_URL}/chat/completions`, { method: 'POST' }).catch((e) => e)
    expect(getAiErrorKey(error)).toBe('aiLocalServerUnreachable')
  })

  test('the model was unloaded: model missing', async () => {
    const { fetchImpl } = recorder(async () => jsonResponse(404, { error: { message: 'Model not found' } }))
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: BASE_URL, modelId: 'local-model' })
    const error = await localFetch(`${BASE_URL}/chat/completions`, { method: 'POST' }).catch((e) => e)
    expect(error.key).toBe('aiLocalServerModelMissing')
    expect(error.params).toEqual({ modelId: 'local-model' })
  })

  test('a cancel is not turned into an engine error', async () => {
    const abort = new DOMException('aborted', 'AbortError')
    const { fetchImpl } = recorder(async () => {
      throw abort
    })
    const localFetch = createLocalServerFetch({ fetchImpl, baseUrl: BASE_URL, modelId: 'local-model' })
    await expect(localFetch(`${BASE_URL}/chat/completions`, { method: 'POST' })).rejects.toBe(abort)
  })
})

describe('toEngineErrorInfo', () => {
  test('keeps the key and params of engine errors, anything else is unreachable', () => {
    const missing = mapLocalServerHttpError({ status: 404, bodyText: '', modelId: 'm', method: 'POST' })
    expect(toEngineErrorInfo(missing, BASE_URL)).toEqual({ key: 'aiLocalServerModelMissing', params: { modelId: 'm' } })
    expect(toEngineErrorInfo(new Error('x'), BASE_URL)).toEqual({
      key: 'aiLocalServerUnreachable',
      params: { baseUrl: BASE_URL },
    })
  })
})
