import { getLocalServerTestView } from '@webapp/ai/engines/localServerTest'

const reachable = { reachable: true, models: ['local-model'], contextTokens: 4096, error: null }
const down = {
  reachable: false,
  models: [],
  contextTokens: null,
  error: { key: 'aiLocalServerUnreachable', params: { baseUrl: 'x' } },
}

const view = (overrides: Partial<Parameters<typeof getLocalServerTestView>[0]> = {}) =>
  getLocalServerTestView({
    probe: reachable,
    baseUrl: 'http://localhost:1234/v1',
    allowlist: [],
    pageProtocol: 'https:',
    ...overrides,
  })

describe('getLocalServerTestView', () => {
  test('LM Studio on this device', () => {
    expect(view()).toEqual({
      reachable: true,
      models: ['local-model'],
      hostingClass: 'onDevice',
      contextTokens: 4096,
      error: null,
      showHttpsHint: false,
      showCloudWarning: false,
    })
  })

  test('an allowlisted LAN server is the organisation network', () => {
    const result = view({ baseUrl: 'http://10.0.0.5:8000/v1', allowlist: ['http://10.0.0.5:8000'] })
    expect(result.hostingClass).toBe('orgHosted')
    expect(result.showCloudWarning).toBe(false)
  })

  test('a LAN server that is not on the allowlist counts as cloud', () => {
    const result = view({ baseUrl: 'http://192.168.1.20:1234/v1' })
    expect(result.hostingClass).toBe('cloud')
    expect(result.showCloudWarning).toBe(true)
  })

  test('HTTPS hint: failed test of a plain-HTTP LAN server from an HTTPS page', () => {
    expect(view({ probe: down, baseUrl: 'http://10.0.0.5:8000/v1' }).showHttpsHint).toBe(true)
    expect(view({ probe: down, baseUrl: 'http://10.0.0.5:8000/v1', pageProtocol: 'http:' }).showHttpsHint).toBe(false)
    expect(view({ probe: down, baseUrl: 'https://10.0.0.5:8000/v1' }).showHttpsHint).toBe(false)
    // localhost is a secure context: no mixed content
    expect(view({ probe: down }).showHttpsHint).toBe(false)
    expect(view({ baseUrl: 'http://10.0.0.5:8000/v1' }).showHttpsHint).toBe(false)
  })

  test('the probe error is passed through', () => {
    expect(view({ probe: down }).error?.key).toBe('aiLocalServerUnreachable')
  })
})
