import { toMapImageFormats } from '@core/map/customLayers/mapServiceCapabilities'
import { parseWmsCapabilities } from '@server/modules/geo/service/mapCapabilities/wmsCapabilitiesParser'
import { parseXmlDocument, type XmlElement } from '@server/modules/geo/service/mapCapabilities/xmlElements'

const wms130 = `<?xml version="1.0" encoding="UTF-8"?>
<WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
  <Service><Name>WMS</Name><Title>Forest maps</Title></Service>
  <Capability>
    <Request>
      <GetMap>
        <Format>image/png</Format>
        <Format>image/png; mode=8bit</Format>
        <Format>image/jpeg</Format>
        <Format>image/tiff</Format>
        <DCPType><HTTP><Get>
          <OnlineResource xlink:type="simple" xlink:href="http://maps.example.org/geoserver/wms?map=forest&amp;SERVICE=WMS&amp;REQUEST=GetCapabilities"/>
        </Get></HTTP></DCPType>
      </GetMap>
    </Request>
    <Layer>
      <Title>Root</Title>
      <CRS>EPSG:4326</CRS>
      <CRS>EPSG:3857</CRS>
      <Attribution><Title>© Forest agency</Title></Attribution>
      <Layer queryable="1"><Name>forest:cover</Name><Title>Forest cover 2020</Title></Layer>
      <Layer>
        <Title>Group without name</Title>
        <Layer>
          <Name>forest:loss</Name>
          <Title><![CDATA[Loss & gain]]></Title>
          <Attribution><Title>Hansen et al.</Title></Attribution>
        </Layer>
      </Layer>
      <Layer><Name>forest:plots</Name></Layer>
    </Layer>
  </Capability>
</WMS_Capabilities>`

const wms111 = `<?xml version="1.0"?>
<!DOCTYPE WMT_MS_Capabilities SYSTEM "http://schemas.opengis.net/wms/1.1.1/WMS_MS_Capabilities.dtd">
<WMT_MS_Capabilities version="1.1.1">
  <Service><Name>OGC:WMS</Name><Title>Old server</Title></Service>
  <Capability>
    <Request><GetMap><Format>image/jpeg</Format></GetMap></Request>
    <Layer>
      <SRS>EPSG:4326 EPSG:900913</SRS>
      <Layer><Name>roads</Name><Title>Roads</Title></Layer>
    </Layer>
    <Layer>
      <SRS>EPSG:4326</SRS>
      <Layer><Name>dem</Name><Title>DEM</Title></Layer>
    </Layer>
  </Capability>
</WMT_MS_Capabilities>`

/**
 * Parses a WMS document.
 * @param {string} xml - The document.
 * @param {string} requestUrl - The capabilities request URL.
 * @returns {object} The capabilities summary.
 */
const parse = (xml: string, requestUrl: string) =>
  parseWmsCapabilities({ root: parseXmlDocument(xml) as XmlElement, requestUrl })

describe('map WMS capabilities parser (268)', () => {
  test('reads a WMS 1.3.0 document: named layers in document order, inherited CRS and attribution', () => {
    const capabilities = parse(wms130, 'https://maps.example.org/geoserver/ows?SERVICE=WMS&REQUEST=GetCapabilities')
    expect(capabilities).toEqual({
      kind: 'wms',
      version: '1.3.0',
      title: 'Forest maps',
      url: 'https://maps.example.org/geoserver/wms?map=forest',
      formats: ['image/png', 'image/jpeg'],
      webMercator: true,
      truncated: false,
      layers: [
        { name: 'forest:cover', title: 'Forest cover 2020', webMercator: true, attribution: '© Forest agency' },
        { name: 'forest:loss', title: 'Loss & gain', webMercator: true, attribution: 'Hansen et al.' },
        { name: 'forest:plots', title: 'forest:plots', webMercator: true, attribution: '© Forest agency' },
      ],
    })
  })

  test('reads a WMS 1.1.1 document (SRS lists), falling back to the request URL for GetMap', () => {
    const capabilities = parse(wms111, 'http://old.example.org/cgi-bin/mapserv?map=/maps/a.map&SERVICE=WMS')
    expect(capabilities.version).toBe('1.1.1')
    expect(capabilities.formats).toEqual(['image/jpeg'])
    expect(capabilities.url).toBe('http://old.example.org/cgi-bin/mapserv?map=%2Fmaps%2Fa.map')
    expect(capabilities.layers.map(({ name, webMercator }) => ({ name, webMercator }))).toEqual([
      { name: 'roads', webMercator: true },
      { name: 'dem', webMercator: false },
    ])
  })

  test('lists at most 500 layers and says so', () => {
    const layers = Array.from({ length: 501 }, (_value, index) => `<Layer><Name>l${index}</Name></Layer>`).join('')
    const xml = `<WMS_Capabilities version="1.3.0"><Capability><Layer><CRS>EPSG:3857</CRS>${layers}</Layer></Capability></WMS_Capabilities>`
    const capabilities = parse(xml, 'https://example.org/wms')
    expect(capabilities.layers).toHaveLength(500)
    expect(capabilities.truncated).toBe(true)
  })

  test('walks deeply nested layers without recursion', () => {
    const depth = 3000
    const xml = `<WMS_Capabilities version="1.3.0"><Capability>${'<Layer><CRS>EPSG:3857</CRS>'.repeat(depth)}<Layer><Name>deep</Name></Layer>${'</Layer>'.repeat(depth)}</Capability></WMS_Capabilities>`
    expect(parse(xml, 'https://example.org/wms').layers.map((layer) => layer.name)).toEqual(['deep'])
  })

  test('walks thousands of nested unnamed layers with CRS lists quickly', () => {
    const depth = 5000
    const open = '<Layer><CRS>EPSG:4326</CRS><CRS>EPSG:2154</CRS><CRS>EPSG:32631</CRS>'
    const xml = `<WMS_Capabilities version="1.3.0"><Capability>${open.repeat(depth)}<Layer><CRS>EPSG:3857</CRS><Name>bottom</Name></Layer>${'</Layer>'.repeat(depth)}</Capability></WMS_Capabilities>`
    const root = parseXmlDocument(xml) as XmlElement
    const start = Date.now()
    const capabilities = parseWmsCapabilities({ root, requestUrl: 'https://example.org/wms' })
    expect(Date.now() - start).toBeLessThan(2000)
    expect(capabilities.layers).toEqual([{ name: 'bottom', title: 'bottom', webMercator: true, attribution: '' }])
  })

  test('maps service MIME types to the supported image formats', () => {
    expect(toMapImageFormats(['image/jpg', 'image/png8', 'image/gif', 'image/png'])).toEqual([
      'image/png',
      'image/jpeg',
    ])
  })

  test('does not parse malformed documents or expand custom entities', () => {
    expect(parseXmlDocument('not xml')).toBeNull()
    const entityBomb = `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;">]><WMS_Capabilities>&lol2;</WMS_Capabilities>`
    expect(parseXmlDocument(entityBomb)).toBeNull()
  })
})
