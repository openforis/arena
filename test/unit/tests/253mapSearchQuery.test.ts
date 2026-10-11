import {
  buildMapSearchResults,
  findRecordCandidates,
  parseMapSearchQuery,
} from '@webapp/components/MapContainer/workspace/search/mapSearchQuery'
import type { MapRecordCandidate } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'

const candidate = (label: string): MapRecordCandidate => ({ id: `id-${label}`, label, lat: 0, lng: 0 })

const expectPoint = (input: string, lat: number, lng: number, precision = 6) => {
  const query = parseMapSearchQuery(input)
  expect(query.type).toBe('coordinates')
  if (query.type !== 'coordinates') return
  expect(query.lat).toBeCloseTo(lat, precision)
  expect(query.lng).toBeCloseTo(lng, precision)
}

describe('Map search query (253)', () => {
  test('empty input', () => {
    expect(parseMapSearchQuery('   ')).toEqual({ type: 'empty' })
  })

  test('decimal pairs with dot or comma decimals and signs', () => {
    expectPoint('41.9, 12.5', 41.9, 12.5)
    expectPoint('41,9 12,5', 41.9, 12.5)
    expectPoint('-0.42;36.95', -0.42, 36.95)
    expectPoint('+41.9 -12.5', 41.9, -12.5)
  })

  test('out-of-range decimal pairs are invalid coordinates', () => {
    expect(parseMapSearchQuery('95, 1')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('10, 181')).toEqual({ type: 'invalidCoordinates' })
  })

  test('UTM with or without E/N, south bands', () => {
    expectPoint('37M 271977 E 9953205 N', -0.4230965, 36.951199, 5)
    expectPoint('33T 292335 4642016', 41.9028, 12.4964, 4)
    expectPoint('33t 292335, 4642016', 41.9028, 12.4964, 4)
  })

  test('invalid UTM values', () => {
    expect(parseMapSearchQuery('61M 271977 9953205')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('37M 50000 9953205')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('37M 271977 10000001')).toEqual({ type: 'invalidCoordinates' })
  })

  test('DMS in either order, with ASCII quotes and comma decimals', () => {
    expectPoint('0°25′23″ S, 36°57′04″ E', -0.42305556, 36.95111111)
    expectPoint(`36°57'04" E 0°25'23" S`, -0.42305556, 36.95111111)
    expectPoint('0°25’23” S 36°57’04” E', -0.42305556, 36.95111111)
    expectPoint('0º25′23″ S, 36˚57′04″ E', -0.42305556, 36.95111111)
    expectPoint(`41°54' N 12°30' E`, 41.9, 12.5)
    expectPoint('41°54′23,5″ N 12°30′ E', 41 + 54 / 60 + 23.5 / 3600, 12.5, 8)
  })

  test('invalid DMS', () => {
    expect(parseMapSearchQuery('41°70′ N, 12° E')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('41° N')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('41° N 12° N')).toEqual({ type: 'invalidCoordinates' })
    expect(parseMapSearchQuery('41° N 12° E foo')).toEqual({ type: 'invalidCoordinates' })
  })

  test('anything else is text', () => {
    expect(parseMapSearchQuery('12')).toEqual({ type: 'text', text: '12' })
    expect(parseMapSearchQuery(' plot 3 ')).toEqual({ type: 'text', text: 'plot 3' })
    expect(parseMapSearchQuery('41.9 12.5 7')).toEqual({ type: 'text', text: '41.9 12.5 7' })
  })

  test('findRecordCandidates ranks exact, prefix, substring, in natural order', () => {
    const candidates = ['12', '1', '112', '21', '2', 'A12', 'x'].map(candidate)
    const labels = (text: string, limit?: number) => findRecordCandidates(candidates, text, limit).map((c) => c.label)
    expect(labels('1')).toEqual(['1', '12', '112', '21', 'A12'])
    expect(labels('12')).toEqual(['12', '112', 'A12'])
    expect(labels('a')).toEqual(['A12'])
    expect(labels(' ')).toEqual([])
    expect(labels('1', 2)).toEqual(['1', '12'])
  })

  test('buildMapSearchResults puts coordinates first, then records', () => {
    expect(buildMapSearchResults({ input: '', candidates: [] })).toEqual([])
    expect(buildMapSearchResults({ input: 'zz', candidates: [candidate('1')] })).toEqual([{ type: 'noMatch' }])
    const both = buildMapSearchResults({ input: '1 2', candidates: [candidate('1 2')] })
    expect(both.map((result) => result.type)).toEqual(['coordinates', 'record'])
    expect(buildMapSearchResults({ input: '95, 1', candidates: [] })).toEqual([{ type: 'invalidCoordinates' }])
  })
})
