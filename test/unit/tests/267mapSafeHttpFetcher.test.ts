import http from 'node:http'
import https from 'node:https'

import SystemError from '@core/systemError'
import {
  buildAxiosConfig,
  buildRequestConfig,
  createSafeHttpFetcher,
  type DnsLookup,
  type HttpGet,
  type HttpResponse,
  type ResolvedAddress,
  type SafeRequestConfig,
  toFetchError,
} from '@server/modules/geo/service/mapCapabilities/safeHttpFetcher'

const publicAddress = { address: '93.184.215.14', family: 4 }

/**
 * Builds a fake response.
 * @param {string} body - The body.
 * @param {string} [contentType] - The Content-Type header.
 * @returns {HttpResponse} The response.
 */
const xmlResponse = (body: string, contentType = 'application/xml'): HttpResponse => ({
  status: 200,
  headers: { 'content-type': contentType },
  data: Buffer.from(body, 'utf8'),
})

/**
 * Creates a fetcher with a fake resolver and a fake HTTP client that record their calls.
 * @param {object} [options] - Options.
 * @param {Array} [options.addresses] - The DNS answer.
 * @param {HttpResponse} [options.response] - The HTTP response.
 * @returns {object} The calls and the fetcher.
 */
const newFakes = ({
  addresses = [publicAddress],
  response = xmlResponse('<WMS_Capabilities/>'),
}: { addresses?: Array<{ address: string; family: number }>; response?: HttpResponse } = {}) => {
  const dnsCalls: string[] = []
  const httpCalls: Array<{ url: string; config: SafeRequestConfig }> = []
  const dnsLookup: DnsLookup = async (hostname) => {
    dnsCalls.push(hostname)
    return addresses
  }
  const httpGet: HttpGet = async (url, config) => {
    httpCalls.push({ url, config })
    return response
  }
  return { dnsCalls, httpCalls, fetcher: createSafeHttpFetcher({ dnsLookup, httpGet }) }
}

/**
 * Waits for a promise expected to reject with a SystemError.
 * @param {Promise} promise - The promise.
 * @returns {Promise<SystemError>} The rejection reason.
 */
const rejectionOf = async (promise: Promise<unknown>): Promise<SystemError> => {
  try {
    await promise
  } catch (error) {
    return error as SystemError
  }
  throw new Error('the promise did not reject')
}

/**
 * Calls the pinned lookup of a request configuration.
 * @param {SafeRequestConfig} config - The configuration.
 * @param {string} hostname - The host name the HTTP agent asks for.
 * @returns {Promise<ResolvedAddress[]>} The addresses it answers with.
 */
const pinnedAddressesOf = (config: SafeRequestConfig, hostname: string): Promise<ResolvedAddress[]> =>
  new Promise((resolve) => {
    config.lookup(hostname, { all: true }, (_error, addresses) => resolve(addresses as ResolvedAddress[]))
  })

describe('map capabilities safe HTTP fetcher (267)', () => {
  test('resolves the host once and pins the connection to the vetted addresses', async () => {
    const { dnsCalls, httpCalls, fetcher } = newFakes()
    const { body } = await fetcher.fetchText(new URL('https://example.org/wms?SERVICE=WMS'))
    expect(body).toBe('<WMS_Capabilities/>')
    expect(dnsCalls).toEqual(['example.org'])
    expect(httpCalls).toHaveLength(1)
    const { url, config } = httpCalls[0]
    expect(url).toBe('https://example.org/wms?SERVICE=WMS')
    expect(config).toMatchObject({
      maxRedirects: 0,
      proxy: false,
      timeout: 10000,
      maxContentLength: 2 * 1024 * 1024,
      responseType: 'arraybuffer',
    })
    expect(config.signal).toBeInstanceOf(AbortSignal)
    expect(config.validateStatus(302)).toBe(true)
    expect(await pinnedAddressesOf(config, 'example.org')).toEqual([{ address: '93.184.215.14', family: 4 }])
  })

  test('refuses a host when any DNS answer is not public, without sending the request', async () => {
    const { httpCalls, fetcher } = newFakes({ addresses: [publicAddress, { address: '10.0.0.5', family: 4 }] })
    const error = await rejectionOf(fetcher.fetchText(new URL('https://rebind.example.org/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.urlNotAllowed')
    expect(error.statusCode).toBe(400)
    expect(httpCalls).toHaveLength(0)
  })

  test('refuses an IPv4-mapped loopback DNS answer', async () => {
    const { httpCalls, fetcher } = newFakes({ addresses: [{ address: '::ffff:127.0.0.1', family: 6 }] })
    const error = await rejectionOf(fetcher.fetchText(new URL('https://mapped.example.org/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.urlNotAllowed')
    expect(httpCalls).toHaveLength(0)
  })

  test.each([
    'http://127.0.0.1/',
    'http://2130706433/',
    'http://0x7f.1/',
    'http://0/',
    'http://[::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://169.254.169.254/latest/meta-data/',
    'http://localhost:8080/',
    'http://api.localhost/',
  ])('refuses %s without resolving it', async (url) => {
    const { dnsCalls, httpCalls, fetcher } = newFakes()
    const error = await rejectionOf(fetcher.fetchText(new URL(url)))
    expect(error.key).toBe('appErrors:mapCustomLayers.urlNotAllowed')
    expect(dnsCalls).toEqual([])
    expect(httpCalls).toEqual([])
  })

  test('connects to a public IP literal without a DNS lookup', async () => {
    const { dnsCalls, httpCalls, fetcher } = newFakes()
    await fetcher.fetchText(new URL('http://8.8.8.8/wms'))
    expect(dnsCalls).toEqual([])
    expect(await pinnedAddressesOf(httpCalls[0].config, '8.8.8.8')).toEqual([{ address: '8.8.8.8', family: 4 }])
  })

  test('reports a host that does not resolve', async () => {
    const fetcher = createSafeHttpFetcher({
      dnsLookup: async () => {
        throw Object.assign(new Error('getaddrinfo ENOTFOUND nowhere.example'), { code: 'ENOTFOUND' })
      },
      httpGet: async () => xmlResponse(''),
    })
    const error = await rejectionOf(fetcher.fetchText(new URL('https://nowhere.example/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.hostNotFound')
    expect(error.params).toEqual({ host: 'nowhere.example' })
  })

  test('does not follow redirects', async () => {
    const { fetcher } = newFakes({
      response: { status: 302, headers: { location: 'http://10.0.0.1/' }, data: Buffer.from('') },
    })
    const error = await rejectionOf(fetcher.fetchText(new URL('https://example.org/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.redirectNotFollowed')
    expect(error.params).toEqual({ location: 'http://10.0.0.1/' })
  })

  test('reports HTTP errors of the service with their status (HTTP 502)', async () => {
    const { fetcher } = newFakes({ response: { status: 503, headers: {}, data: Buffer.from('') } })
    const error = await rejectionOf(fetcher.fetchText(new URL('https://example.org/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.fetchFailed')
    expect(error.params).toEqual({ status: 503 })
    expect(error.statusCode).toBe(502)
  })

  test('accepts XML served as text/plain, refuses HTML', async () => {
    const plain = newFakes({ response: xmlResponse('﻿<?xml version="1.0"?><Capabilities/>', 'text/plain') })
    const { body } = await plain.fetcher.fetchText(new URL('https://example.org/'))
    expect(body).toBe('<?xml version="1.0"?><Capabilities/>')
    const html = newFakes({ response: xmlResponse('<html></html>', 'text/html; charset=utf-8') })
    const error = await rejectionOf(html.fetcher.fetchText(new URL('https://example.org/')))
    expect(error.key).toBe('appErrors:mapCustomLayers.notCapabilities')
  })

  test.each([
    [{ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' }, 'timeout', { seconds: 10 }, 504],
    [{ name: 'CanceledError', code: 'ERR_CANCELED', message: 'canceled' }, 'timeout', { seconds: 10 }, 504],
    [
      { code: 'ERR_BAD_RESPONSE', message: 'maxContentLength size of 2097152 exceeded' },
      'responseTooLarge',
      { limitMb: 2 },
      400,
    ],
    [{ code: 'ERR_BAD_RESPONSE', message: 'stream has been aborted' }, 'unreachable', undefined, 502],
    [{ code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 93.184.215.14:443' }, 'unreachable', undefined, 502],
  ])('maps the transport error %p to %s', (raw, name, params, statusCode) => {
    const error = toFetchError(raw, { timeoutMs: 10000, maxBytes: 2 * 1024 * 1024 }) as SystemError
    expect(error.key).toBe(`appErrors:mapCustomLayers.${name}`)
    expect(error.params).toEqual(params)
    expect(error.statusCode).toBe(statusCode)
  })

  test('the pinned lookup answers with the array when options.all is set, with the first address otherwise', async () => {
    const { httpCalls, fetcher } = newFakes({
      addresses: [publicAddress, { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 }],
    })
    await fetcher.fetchText(new URL('https://example.org/'))
    const { lookup } = httpCalls[0].config
    const all = await new Promise((resolve) => {
      lookup('example.org', { all: true }, (_error, addresses) => resolve(addresses))
    })
    expect(all).toEqual([
      { address: '93.184.215.14', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ])
    const single = await new Promise((resolve) => {
      lookup('example.org', {}, (_error, address, family) => resolve({ address, family }))
    })
    expect(single).toEqual({ address: '93.184.215.14', family: 4 })
  })

  test('times out a DNS lookup that never answers, without sending the request', async () => {
    jest.useFakeTimers()
    try {
      const httpCalls: string[] = []
      const fetcher = createSafeHttpFetcher({
        dnsLookup: () => new Promise(() => undefined),
        httpGet: async (url) => {
          httpCalls.push(url)
          return xmlResponse('')
        },
      })
      const pending = rejectionOf(fetcher.fetchText(new URL('https://slow.example.org/')))
      await jest.advanceTimersByTimeAsync(10000)
      const error = await pending
      expect(error.key).toBe('appErrors:mapCustomLayers.timeout')
      expect(error.params).toEqual({ seconds: 10 })
      expect(httpCalls).toEqual([])
    } finally {
      jest.useRealTimers()
    }
  })

  test('the axios configuration disables proxies and redirects, uses fresh agents and keeps the pinned lookup and size cap', () => {
    const config = buildRequestConfig({
      addresses: [{ address: '93.184.215.14', family: 4 }],
      timeoutMs: 10000,
      maxBytes: 2 * 1024 * 1024,
    })
    const axiosConfig = buildAxiosConfig(config)
    expect(axiosConfig).toMatchObject({ proxy: false, maxRedirects: 0, maxContentLength: 2 * 1024 * 1024 })
    expect(axiosConfig.httpAgent).toBeInstanceOf(http.Agent)
    expect((axiosConfig.httpAgent as unknown as { options: object }).options).toMatchObject({ keepAlive: false })
    expect(axiosConfig.httpsAgent).toBeInstanceOf(https.Agent)
    expect((axiosConfig.httpsAgent as unknown as { options: object }).options).toMatchObject({ keepAlive: false })
    expect(axiosConfig.lookup).toBe(config.lookup)
    expect(buildAxiosConfig(config).httpAgent).not.toBe(axiosConfig.httpAgent)
  })
})
