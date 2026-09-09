import { nodeDefType } from '@core/survey/nodeDef'

import {
  arenaFileTypeFromMediatype,
  mapXFormTypeToNodeDefType,
} from '@server/modules/odkImport/service/odkImport/model/xformTypeMapping'

describe('odkImport / xformTypeMapping', () => {
  test.each([
    ['string', nodeDefType.text],
    ['int', nodeDefType.integer],
    ['decimal', nodeDefType.decimal],
    ['date', nodeDefType.date],
    ['time', nodeDefType.time],
    ['geopoint', nodeDefType.coordinate],
    ['binary', nodeDefType.file],
    ['select1', nodeDefType.code],
    ['select', nodeDefType.code],
  ])('maps ODK type %s to Arena type %s, unflagged', (odkType, expectedType) => {
    const result = mapXFormTypeToNodeDefType({ odkType, readonly: null, hasBodyControl: true })
    expect(result).toEqual({ nodeDefType: expectedType, skip: false, flag: null })
  })

  test.each([
    ['dateTime', nodeDefType.text, 'unmappedType'],
    ['geotrace', nodeDefType.geo, 'lossyGeoConversion'],
    ['geoshape', nodeDefType.geo, 'lossyGeoConversion'],
    ['barcode', nodeDefType.text, 'unmappedType'],
    ['unknown_type', nodeDefType.text, 'unmappedType'],
  ])('flags lossy/unmapped ODK type %s (-> %s, %s) without dropping data', (odkType, expectedType, expectedFlag) => {
    const result = mapXFormTypeToNodeDefType({ odkType, readonly: null, hasBodyControl: true })
    expect(result).toEqual({ nodeDefType: expectedType, skip: false, flag: expectedFlag })
  })

  test('a readonly string bind with no body control is treated as a skipped ODK "note"', () => {
    const result = mapXFormTypeToNodeDefType({ odkType: 'string', readonly: 'true()', hasBodyControl: false })
    expect(result).toEqual({ nodeDefType: null, skip: true, flag: 'skippedNote' })
  })

  test('a readonly string bind WITH a body control (e.g. a calculated field) is not treated as a note', () => {
    const result = mapXFormTypeToNodeDefType({ odkType: 'string', readonly: 'true()', hasBodyControl: true })
    expect(result).toEqual({ nodeDefType: nodeDefType.text, skip: false, flag: null })
  })

  test.each([
    ['image/*', 'image'],
    ['video/*', 'video'],
    ['audio/*', 'audio'],
    [null, 'other'],
    ['application/octet-stream', 'other'],
  ])('arenaFileTypeFromMediatype maps %s to %s', (mediatype, expected) => {
    expect(arenaFileTypeFromMediatype(mediatype)).toBe(expected)
  })
})
