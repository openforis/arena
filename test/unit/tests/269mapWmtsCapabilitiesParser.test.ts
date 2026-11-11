import { parseWmtsCapabilities } from '@server/modules/geo/service/mapCapabilities/wmtsCapabilitiesParser'
import { parseXmlDocument, type XmlElement } from '@server/modules/geo/service/mapCapabilities/xmlElements'

/**
 * Builds a TileMatrixSet element.
 * @param {object} params - Parameters.
 * @param {string} params.id - The identifier.
 * @param {string} params.crs - The SupportedCRS.
 * @param {string} params.prefix - The TileMatrix identifier prefix.
 * @param {number} params.count - The number of matrices.
 * @param {number} [params.firstScale] - The scale denominator of the first matrix.
 * @returns {string} The XML.
 */
const matrixSetXml = ({
  id,
  crs,
  prefix,
  count,
  firstScale = 559082264.0287178,
}: {
  id: string
  crs: string
  prefix: string
  count: number
  firstScale?: number
}): string => {
  const matrices = Array.from(
    { length: count },
    (_value, index) =>
      `<TileMatrix><ows:Identifier>${prefix}${index}</ows:Identifier><ScaleDenominator>${firstScale / 2 ** index}</ScaleDenominator></TileMatrix>`
  ).join('')
  return `<TileMatrixSet><ows:Identifier>${id}</ows:Identifier><ows:SupportedCRS>${crs}</ows:SupportedCRS>${matrices}</TileMatrixSet>`
}

const wmtsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
  <ows:ServiceIdentification><ows:Title>National imagery</ows:Title></ows:ServiceIdentification>
  <ows:ServiceProvider><ows:ProviderName>Mapping agency</ows:ProviderName></ows:ServiceProvider>
  <ows:OperationsMetadata>
    <ows:Operation name="GetTile">
      <ows:DCP><ows:HTTP>
        <ows:Get xlink:href="https://tiles.example.org/rest/"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>RESTful</ows:Value></ows:AllowedValues></ows:Constraint></ows:Get>
        <ows:Get xlink:href="https://tiles.example.org/wmts?"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>KVP</ows:Value></ows:AllowedValues></ows:Constraint></ows:Get>
      </ows:HTTP></ows:DCP>
    </ows:Operation>
  </ows:OperationsMetadata>
  <Contents>
    <Layer>
      <ows:Title>Orthophoto</ows:Title>
      <ows:Identifier>ortho</ows:Identifier>
      <Style isDefault="true"><ows:Identifier>normal</ows:Identifier></Style>
      <Format>image/jpeg</Format>
      <Dimension><ows:Identifier>Time</ows:Identifier><Default>2024</Default><Value>2023</Value><Value>2024</Value></Dimension>
      <TileMatrixSetLink><TileMatrixSet>WGS84</TileMatrixSet></TileMatrixSetLink>
      <TileMatrixSetLink><TileMatrixSet>GoogleMaps</TileMatrixSet></TileMatrixSetLink>
      <ResourceURL format="image/jpeg" resourceType="tile" template="http://tiles.example.org/rest/ortho/{Style}/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg"/>
    </Layer>
    <Layer>
      <ows:Title>Roads</ows:Title>
      <ows:Identifier>roads &amp; rails</ows:Identifier>
      <Format>image/png</Format>
      <Format>image/png8</Format>
      <TileMatrixSetLink><TileMatrixSet>EPSG:3857</TileMatrixSet></TileMatrixSetLink>
    </Layer>
    <Layer>
      <ows:Title>Lambert only</ows:Title>
      <ows:Identifier>lambert</ows:Identifier>
      <Format>image/png</Format>
      <TileMatrixSetLink><TileMatrixSet>Lambert</TileMatrixSet></TileMatrixSetLink>
    </Layer>
    ${matrixSetXml({ id: 'WGS84', crs: 'urn:ogc:def:crs:EPSG::4326', prefix: '', count: 3, firstScale: 279541132.0143589 })}
    ${matrixSetXml({ id: 'GoogleMaps', crs: 'urn:ogc:def:crs:EPSG::3857', prefix: '', count: 20 })}
    ${matrixSetXml({ id: 'EPSG:3857', crs: 'EPSG:3857', prefix: 'EPSG:3857:', count: 30 })}
    ${matrixSetXml({ id: 'Lambert', crs: 'urn:ogc:def:crs:EPSG::2154', prefix: '', count: 10 })}
  </Contents>
</Capabilities>`

const requestUrl = 'https://tiles.example.org/wmts?SERVICE=WMTS&REQUEST=GetCapabilities'

/**
 * Parses a WMTS document.
 * @param {string} xml - The document.
 * @returns {object|null} The capabilities summary.
 */
const parse = (xml: string) => parseWmtsCapabilities({ root: parseXmlDocument(xml) as XmlElement, requestUrl })

describe('map WMTS capabilities parser (269)', () => {
  test('reads the service and keeps every layer, marking those Leaflet cannot show', () => {
    const capabilities = parse(wmtsXml)
    expect(capabilities).toMatchObject({
      kind: 'wmts',
      version: '1.0.0',
      title: 'National imagery',
      url: requestUrl,
      formats: ['image/png', 'image/jpeg'],
      webMercator: true,
      truncated: false,
    })
    expect(capabilities?.layers.map(({ name, title, webMercator }) => ({ name, title, webMercator }))).toEqual([
      { name: 'ortho', title: 'Orthophoto', webMercator: true },
      { name: 'roads & rails', title: 'Roads', webMercator: true },
      { name: 'lambert', title: 'Lambert only', webMercator: false },
    ])
  })

  test('fills REST templates with the Web Mercator matrix set, default style and dimension, upgrading http', () => {
    const [ortho] = parse(wmtsXml)?.layers ?? []
    expect(ortho).toEqual({
      name: 'ortho',
      title: 'Orthophoto',
      attribution: 'Mapping agency',
      webMercator: true,
      maxZoom: 19,
      tileUrlTemplates: {
        'image/jpeg': 'https://tiles.example.org/rest/ortho/normal/2024/GoogleMaps/{z}/{y}/{x}.jpg',
      },
    })
  })

  test('builds encoded KVP templates when there is no ResourceURL, capping the zoom at 24', () => {
    const roads = parse(wmtsXml)?.layers[1]
    expect(roads?.maxZoom).toBe(24)
    expect(roads?.tileUrlTemplates).toEqual({
      'image/png':
        'https://tiles.example.org/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=roads%20%26%20rails&STYLE=default' +
        '&TILEMATRIXSET=EPSG%3A3857&FORMAT=image%2Fpng&TILEMATRIX=EPSG%3A3857%3A{z}&TILEROW={y}&TILECOL={x}',
    })
  })

  test('refuses matrix sets that do not start at Web Mercator zoom 0 or skip identifiers', () => {
    const badScale = matrixSetXml({ id: 'M', crs: 'EPSG:3857', prefix: '', count: 5, firstScale: 279541132.0143589 })
    const xml = `<Capabilities version="1.0.0"><Contents><Layer><ows:Identifier>a</ows:Identifier><Format>image/png</Format><TileMatrixSetLink><TileMatrixSet>M</TileMatrixSet></TileMatrixSetLink><ResourceURL format="image/png" resourceType="tile" template="https://t.example.org/{TileMatrix}/{TileCol}/{TileRow}.png"/></Layer>${badScale}</Contents></Capabilities>`
    expect(parse(xml)?.layers[0].webMercator).toBe(false)
    const skipped = `<TileMatrixSet><ows:Identifier>M</ows:Identifier><ows:SupportedCRS>EPSG:3857</ows:SupportedCRS><TileMatrix><ows:Identifier>0</ows:Identifier><ScaleDenominator>559082264.0287178</ScaleDenominator></TileMatrix><TileMatrix><ows:Identifier>2</ows:Identifier><ScaleDenominator>139770566</ScaleDenominator></TileMatrix></TileMatrixSet>`
    expect(parse(xml.replace(badScale, skipped))?.layers[0].webMercator).toBe(false)
  })

  test('skips REST templates with unknown placeholders', () => {
    const set = matrixSetXml({ id: 'G', crs: 'EPSG:3857', prefix: '', count: 3 })
    const xml = `<Capabilities version="1.0.0"><Contents><Layer><ows:Identifier>a</ows:Identifier><TileMatrixSetLink><TileMatrixSet>G</TileMatrixSet></TileMatrixSetLink><ResourceURL format="image/png" resourceType="tile" template="https://t.example.org/{Unknown}/{TileMatrix}/{TileCol}/{TileRow}.png"/></Layer>${set}</Contents></Capabilities>`
    expect(parse(xml)?.layers[0]).toMatchObject({ webMercator: false })
    expect(parse(xml)?.webMercator).toBe(false)
  })

  test('marks a layer not selectable when its KVP template would fail the save-time check', () => {
    const set = matrixSetXml({ id: 'G', crs: 'EPSG:3857', prefix: '', count: 3 })
    const identifier = 'a'.repeat(3000)
    const xml = `<Capabilities version="1.0.0"><ows:OperationsMetadata><ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="https://t.example.org/wmts"/></ows:HTTP></ows:DCP></ows:Operation></ows:OperationsMetadata><Contents><Layer><ows:Identifier>${identifier}</ows:Identifier><Format>image/png</Format><TileMatrixSetLink><TileMatrixSet>G</TileMatrixSet></TileMatrixSetLink></Layer>${set}</Contents></Capabilities>`
    const capabilities = parse(xml)
    expect(capabilities?.layers[0].webMercator).toBe(false)
    expect(capabilities?.layers[0].tileUrlTemplates).toBeUndefined()
    expect(capabilities?.webMercator).toBe(false)
  })

  test('returns null for a document without Contents', () => {
    expect(parse('<Capabilities version="1.0.0"><ows:ServiceIdentification/></Capabilities>')).toBeNull()
  })

  /**
   * Builds a one-layer document with a Web Mercator matrix set.
   * @param {object} params - Parameters.
   * @param {string} [params.layerExtra] - XML added to the layer.
   * @param {string} [params.operations] - XML of the OperationsMetadata content.
   * @param {string} [params.set] - The matrix set XML.
   * @returns {string} The document.
   */
  const oneLayer = ({
    layerExtra = '',
    operations = '',
    set = matrixSetXml({ id: 'G', crs: 'EPSG:3857', prefix: '', count: 3 }),
  }: {
    layerExtra?: string
    operations?: string
    set?: string
  }): string =>
    `<Capabilities version="1.0.0"><ows:OperationsMetadata>${operations}</ows:OperationsMetadata><Contents><Layer><ows:Identifier>a</ows:Identifier><Format>image/png</Format><TileMatrixSetLink><TileMatrixSet>G</TileMatrixSet></TileMatrixSetLink>${layerExtra}</Layer>${set}</Contents></Capabilities>`

  const restResource =
    '<ResourceURL format="image/png" resourceType="tile" template="https://t.example.org/{Style}/{Time}/{TileMatrix}/{TileRow}/{TileCol}.png"/>'

  test('lists at most 500 layers and says so', () => {
    const set = matrixSetXml({ id: 'G', crs: 'EPSG:3857', prefix: '', count: 3 })
    const layer = (index: number) =>
      `<Layer><ows:Identifier>l${index}</ows:Identifier><Format>image/png</Format><TileMatrixSetLink><TileMatrixSet>G</TileMatrixSet></TileMatrixSetLink><ResourceURL format="image/png" resourceType="tile" template="https://t.example.org/${index}/{TileMatrix}/{TileCol}/{TileRow}.png"/></Layer>`
    const build = (count: number) =>
      parse(
        `<Capabilities version="1.0.0"><Contents>${Array.from({ length: count }, (_v, i) => layer(i)).join('')}${set}</Contents></Capabilities>`
      )
    expect(build(501)).toMatchObject({ truncated: true })
    expect(build(501)?.layers).toHaveLength(500)
    expect(build(500)).toMatchObject({ truncated: false })
  })

  test('URL-encodes style and dimension values in REST templates', () => {
    const xml = oneLayer({
      layerExtra: `<Style isDefault="true"><ows:Identifier>a?b#c</ows:Identifier></Style><Dimension><ows:Identifier>Time</ows:Identifier><Default>2024/01 02</Default></Dimension>${restResource}`,
    })
    expect(parse(xml)?.layers[0].tileUrlTemplates).toEqual({
      'image/png': 'https://t.example.org/a%3Fb%23c/2024%2F01%2002/{z}/{y}/{x}.png',
    })
  })

  test('does not leave an empty path segment for an empty dimension, and falls back to KVP', () => {
    const xml = oneLayer({
      layerExtra: `<Dimension><ows:Identifier>Time</ows:Identifier></Dimension>${restResource}`,
      operations:
        '<ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="https://t.example.org/wmts"/></ows:HTTP></ows:DCP></ows:Operation>',
    })
    const templates = parse(xml)?.layers[0].tileUrlTemplates
    expect(templates?.['image/png']).toContain('REQUEST=GetTile')
    expect(templates?.['image/png']).not.toContain('//{')
    expect(
      parse(oneLayer({ layerExtra: `<Dimension><ows:Identifier>Time</ows:Identifier></Dimension>${restResource}` }))
        ?.layers[0].webMercator
    ).toBe(false)
  })

  test('accepts the ArcGIS Web Mercator identifiers 102100, 102113 and 3785', () => {
    for (const crs of ['urn:ogc:def:crs:EPSG::102100', 'EPSG:102113', 'EPSG:3785']) {
      const set = matrixSetXml({ id: 'G', crs, prefix: '', count: 3 })
      expect(parse(oneLayer({ set, layerExtra: restResource.replace('{Time}/', '') }))?.layers[0].webMercator).toBe(
        true
      )
    }
  })

  test('takes the KVP endpoint only from a Get that allows KVP', () => {
    const get = (href: string, encoding: string) =>
      `<ows:Get xlink:href="${href}"><ows:Constraint name="GetEncoding"><ows:AllowedValues><ows:Value>${encoding}</ows:Value></ows:AllowedValues></ows:Constraint></ows:Get>`
    const operation = (gets: string) =>
      `<ows:Operation name="GetTile"><ows:DCP><ows:HTTP>${gets}</ows:HTTP></ows:DCP></ows:Operation>`
    const restOnly = parse(oneLayer({ operations: operation(get('https://t.example.org/rest/', 'RESTful')) }))
    expect(restOnly?.layers[0].webMercator).toBe(false)
    const both = parse(
      oneLayer({
        operations: operation(get('https://t.example.org/rest/', 'RESTful') + get('https://t.example.org/kvp?', 'KVP')),
      })
    )
    expect(both?.layers[0].tileUrlTemplates?.['image/png']).toMatch(/^https:\/\/t\.example\.org\/kvp\?SERVICE=WMTS/)
  })

  test('finds the KVP endpoint in a later DCP when the first has no Get', () => {
    const operations =
      '<ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Post xlink:href="https://t.example.org/post"/></ows:HTTP></ows:DCP><ows:DCP><ows:HTTP><ows:Get xlink:href="https://t.example.org/kvp"/></ows:HTTP></ows:DCP></ows:Operation>'
    expect(parse(oneLayer({ operations }))?.layers[0].tileUrlTemplates?.['image/png']).toMatch(
      /^https:\/\/t\.example\.org\/kvp\?/
    )
  })

  test('treats isDefault="1" as the default style', () => {
    const xml = oneLayer({
      layerExtra: `<Style><ows:Identifier>first</ows:Identifier></Style><Style isDefault="1"><ows:Identifier>second</ows:Identifier></Style>${restResource.replace('{Time}/', '')}`,
    })
    expect(parse(xml)?.layers[0].tileUrlTemplates?.['image/png']).toContain('/second/')
  })
})
