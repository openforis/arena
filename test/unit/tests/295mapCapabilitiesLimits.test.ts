import {
  createSafeHttpFetcher,
  MAX_CONCURRENT_FETCHES,
  type HttpGet,
  type HttpResponse,
} from '@server/modules/geo/service/mapCapabilities/safeHttpFetcher'
import { deleteSurveyConfigurationProp } from '@server/modules/survey/repository/surveyRepository'

const dnsLookup = async () => [{ address: '93.184.215.14', family: 4 }]

/**
 * Builds a fake response with raw bytes.
 * @param {Buffer} data - The body bytes.
 * @param {string} contentType - The Content-Type header.
 * @returns {HttpResponse} The response.
 */
const response = (data: Buffer, contentType: string): HttpResponse => ({
  status: 200,
  headers: { 'content-type': contentType },
  data,
})

describe('map capabilities limits and encoding (295)', () => {
  test('refuses the call over the concurrency cap and frees the slot after completion or failure', async () => {
    const pending: Array<(r: HttpResponse | Error) => void> = []
    const httpGet: HttpGet = () =>
      new Promise((resolve, reject) => {
        pending.push((r) => (r instanceof Error ? reject(r) : resolve(r)))
      })
    const { fetchText } = createSafeHttpFetcher({ dnsLookup, httpGet })
    const url = new URL('https://example.org/wms')
    const running = Array.from({ length: MAX_CONCURRENT_FETCHES }, () => fetchText(url))
    await expect(fetchText(url)).rejects.toMatchObject({ key: 'appErrors:mapCustomLayers.busy', statusCode: 503 })
    await new Promise((resolve) => setImmediate(resolve))
    pending[0](response(Buffer.from('<a/>'), 'text/xml'))
    pending[1](new Error('boom'))
    const settled = await Promise.allSettled(running.slice(0, 2))
    expect(settled.map(({ status }) => status)).toEqual(['fulfilled', 'rejected'])
    const next = fetchText(url) // two slots are free again
    await new Promise((resolve) => setImmediate(resolve))
    pending[MAX_CONCURRENT_FETCHES](response(Buffer.from('<a/>'), 'text/xml'))
    await expect(next).resolves.toMatchObject({ body: '<a/>' })
    pending[2](response(Buffer.from('<a/>'), 'text/xml'))
    pending[3](response(Buffer.from('<a/>'), 'text/xml'))
    await Promise.all(running.slice(2))
  })

  test('decodes ISO-8859-1 bodies from the Content-Type charset and from the XML declaration', async () => {
    const latin1 = (text: string) => Buffer.from(text, 'latin1')
    const fetchBody = async (data: Buffer, contentType: string) => {
      const { fetchText } = createSafeHttpFetcher({ dnsLookup, httpGet: async () => response(data, contentType) })
      return (await fetchText(new URL('https://example.org/wms'))).body
    }
    expect(await fetchBody(latin1('<a>Forêts</a>'), 'text/xml; charset=ISO-8859-1')).toBe('<a>Forêts</a>')
    expect(await fetchBody(latin1('<?xml version="1.0" encoding="ISO-8859-1"?><a>Forêts</a>'), 'text/xml')).toContain(
      'Forêts'
    )
    expect(await fetchBody(Buffer.from('<a>Forêts</a>'), 'text/xml; charset=unknown-x')).toBe('<a>Forêts</a>')
  })

  test('deleting the files space config removes only that key', async () => {
    const calls: Array<{ query: string; values: unknown }> = []
    const client = { none: async (query: string, values: unknown) => void calls.push({ query, values }) }
    await deleteSurveyConfigurationProp({ surveyId: 3, key: 'filesTotalSpace' }, client as never)
    expect(calls[0].query).toContain('config - $/key/')
    expect(calls[0].values).toEqual({ surveyId: 3, key: 'filesTotalSpace' })
  })
})
