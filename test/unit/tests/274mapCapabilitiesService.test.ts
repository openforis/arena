import type { SafeHttpFetcher } from '@server/modules/geo/service/mapCapabilities/safeHttpFetcher'
import {
  newMapCustomLayersError,
  type MapCustomLayersErrorName,
} from '@server/modules/geo/service/mapCustomLayersErrors'
import { createMapCapabilitiesService, parseCapabilitiesXml } from '@server/modules/geo/service/mapCapabilitiesService'

const wmsXml = `<WMS_Capabilities version="1.3.0"><Service><Title>W</Title></Service><Capability><Layer><CRS>EPSG:3857</CRS><Layer><Name>a</Name></Layer></Layer></Capability></WMS_Capabilities>`
const wmtsXml = `<Capabilities version="1.0.0"><Contents><Layer><ows:Identifier>t</ows:Identifier></Layer></Contents></Capabilities>`
const exceptionXml = `<ServiceExceptionReport version="1.3.0"><ServiceException>Unknown service</ServiceException></ServiceExceptionReport>`

type FetchResult = string | MapCustomLayersErrorName

/**
 * Creates a fake fetcher answering requests in order.
 * @param {FetchResult[]} results - XML bodies, or error names to throw.
 * @returns {{fetcher: SafeHttpFetcher, requests: string[]}} The fetcher and the URLs it was asked for.
 */
const fakeFetcher = (results: FetchResult[]): { fetcher: SafeHttpFetcher; requests: string[] } => {
  const requests: string[] = []
  const fetcher: SafeHttpFetcher = {
    fetchText: async (url: URL) => {
      requests.push(url.toString())
      const result = results[requests.length - 1]
      if (!result.startsWith('<')) throw newMapCustomLayersError(result as MapCustomLayersErrorName)
      return { body: result, contentType: 'text/xml' }
    },
  }
  return { fetcher, requests }
}

/**
 * Runs a request and returns the key of the error it fails with.
 * @param {Promise<unknown>} promise - The request.
 * @returns {Promise<string>} The error key.
 */
const errorKeyOf = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise
  } catch (error) {
    return (error as { key: string }).key
  }
  return 'no error'
}

describe('map capabilities service (274)', () => {
  test('asks for WMS first and stops when it answers', async () => {
    const { fetcher, requests } = fakeFetcher([wmsXml])
    const capabilities = await createMapCapabilitiesService(fetcher).fetchCapabilities('https://maps.example.org/ows')
    expect(capabilities.kind).toBe('wms')
    expect(requests).toEqual(['https://maps.example.org/ows?SERVICE=WMS&REQUEST=GetCapabilities'])
  })

  test.each([
    ['an exception report', exceptionXml],
    ['an HTTP error', 'fetchFailed'],
  ])('tries WMTS after %s', async (_label, wmsResult) => {
    const { fetcher, requests } = fakeFetcher([wmsResult, wmtsXml])
    const capabilities = await createMapCapabilitiesService(fetcher).fetchCapabilities('https://maps.example.org/ows')
    expect(capabilities.kind).toBe('wmts')
    expect(requests[1]).toBe('https://maps.example.org/ows?SERVICE=WMTS&REQUEST=GetCapabilities')
  })

  test.each(['urlNotAllowed', 'timeout', 'responseTooLarge'] as const)(
    'does not try WMTS after %s',
    async (errorName) => {
      const { fetcher, requests } = fakeFetcher([errorName, wmtsXml])
      const key = await errorKeyOf(createMapCapabilitiesService(fetcher).fetchCapabilities('https://maps.example.org/'))
      expect(key).toBe(`appErrors:mapCustomLayers.${errorName}`)
      expect(requests).toHaveLength(1)
    }
  )

  test('fails with notCapabilities when neither service answers', async () => {
    const { fetcher, requests } = fakeFetcher([exceptionXml, '<html/>'])
    const key = await errorKeyOf(createMapCapabilitiesService(fetcher).fetchCapabilities('https://maps.example.org/'))
    expect(key).toBe('appErrors:mapCustomLayers.notCapabilities')
    expect(requests).toHaveLength(2)
  })

  test('fetches a .xml document once, as it is', async () => {
    const { fetcher, requests } = fakeFetcher([wmtsXml])
    await createMapCapabilitiesService(fetcher).fetchCapabilities('https://maps.example.org/1.0.0/WMTSCapabilities.xml')
    expect(requests).toEqual(['https://maps.example.org/1.0.0/WMTSCapabilities.xml'])
  })

  test('refuses other protocols before any request', async () => {
    const { fetcher, requests } = fakeFetcher([])
    const key = await errorKeyOf(createMapCapabilitiesService(fetcher).fetchCapabilities('ftp://maps.example.org/'))
    expect(key).toBe('appErrors:mapCustomLayers.urlNotAllowed')
    expect(requests).toHaveLength(0)
  })

  test('fails with noLayers when a service names no layer', () => {
    const xml =
      '<WMS_Capabilities version="1.3.0"><Capability><Layer><Title>Root</Title></Layer></Capability></WMS_Capabilities>'
    expect(() => parseCapabilitiesXml({ xml, requestUrl: 'https://example.org/wms' })).toThrow(
      expect.objectContaining({ key: 'appErrors:mapCustomLayers.noLayers' })
    )
  })
})
