import SystemError from '@core/systemError'
import {
  buildCapabilitiesUrls,
  parseServiceUrl,
  resolveServiceHref,
} from '@server/modules/geo/service/mapCapabilities/capabilitiesUrl'

/**
 * Runs a function expected to throw a SystemError.
 * @param {Function} fn - The function.
 * @returns {SystemError} The thrown error.
 */
const thrownBy = (fn: () => unknown): SystemError => {
  try {
    fn()
  } catch (error) {
    return error as SystemError
  }
  throw new Error('the function did not throw')
}

describe('map capabilities URLs (266)', () => {
  test('accepts http and https URLs, trimmed and without fragment', () => {
    expect(parseServiceUrl('  https://example.org/wms?map=a#top ').toString()).toBe('https://example.org/wms?map=a')
    expect(parseServiceUrl('http://example.org:8080/geoserver/ows').toString()).toBe(
      'http://example.org:8080/geoserver/ows'
    )
  })

  test('normalises numeric hosts, so the address checks see the real IP', () => {
    expect(parseServiceUrl('http://0x7f.1/').hostname).toBe('127.0.0.1')
    expect(parseServiceUrl('http://2130706433/').hostname).toBe('127.0.0.1')
    expect(parseServiceUrl('http://127.1/').hostname).toBe('127.0.0.1')
    expect(parseServiceUrl('http://[::ffff:127.0.0.1]/').hostname).toBe('[::ffff:7f00:1]')
  })

  test.each([
    ['', 'urlInvalid'],
    [42, 'urlInvalid'],
    ['not a url', 'urlInvalid'],
    [`https://example.org/${'a'.repeat(2048)}`, 'urlInvalid'],
    ['file:///etc/passwd', 'urlNotAllowed'],
    ['ftp://example.org/', 'urlNotAllowed'],
    ['gopher://example.org/', 'urlNotAllowed'],
    ['https://user:secret@example.org/wms', 'urlNotAllowed'],
  ])('refuses %p with %s (HTTP 400)', (value, name) => {
    const error = thrownBy(() => parseServiceUrl(value))
    expect(error.key).toBe(`appErrors:mapCustomLayers.${name}`)
    expect(error.statusCode).toBe(400)
  })

  test('tries WMS then WMTS when the URL names no service', () => {
    expect(buildCapabilitiesUrls(new URL('https://example.org/geoserver/ows?map=a'))).toEqual([
      'https://example.org/geoserver/ows?map=a&SERVICE=WMS&REQUEST=GetCapabilities',
      'https://example.org/geoserver/ows?map=a&SERVICE=WMTS&REQUEST=GetCapabilities',
    ])
  })

  test('keeps the service the URL names and forces GetCapabilities', () => {
    expect(buildCapabilitiesUrls(new URL('https://example.org/wmts?service=wmts&request=GetTile&layer=x'))).toEqual([
      'https://example.org/wmts?layer=x&SERVICE=WMTS&REQUEST=GetCapabilities',
    ])
  })

  test('fetches a capabilities document URL as it is', () => {
    expect(buildCapabilitiesUrls(new URL('https://example.org/1.0.0/WMTSCapabilities.xml'))).toEqual([
      'https://example.org/1.0.0/WMTSCapabilities.xml',
    ])
  })

  test('resolves service links: relative links, https upgrade on the same host, http(s) only', () => {
    const base = 'https://example.org/ows?SERVICE=WMS&REQUEST=GetCapabilities'
    expect(resolveServiceHref('/geoserver/wms', base)).toBe('https://example.org/geoserver/wms')
    expect(resolveServiceHref('http://example.org/wms?map=a', base)).toBe('https://example.org/wms?map=a')
    expect(resolveServiceHref('http://example.org:8080/wms', base)).toBe('http://example.org:8080/wms')
    expect(resolveServiceHref('http://other.example.org/wms', base)).toBe('http://other.example.org/wms')
    expect(resolveServiceHref('javascript:alert(1)', base)).toBeNull()
  })
})
