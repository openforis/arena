import { Readable } from 'stream'

import { FileFormats } from '@core/fileFormats'

import * as FlatDataReader from '@server/utils/file/flatDataReader'

import { readHeadersAndRows, toXlsxBuffer, Rows } from '../../utils/flatDataImportTestUtils'

const readXlsx = async (...sheetsRows: Rows[]) =>
  readHeadersAndRows({ stream: Readable.from([await toXlsxBuffer(...sheetsRows)]), fileFormat: FileFormats.xlsx })

describe('FlatDataReader (xlsx)', () => {
  test('reads headers and rows as objects', async () => {
    const { headers, rows } = await readXlsx([
      ['a', 'b', 'c'],
      ['x', 'y', 'z'],
      ['u', 'v', 'w'],
    ])
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      { a: 'x', b: 'y', c: 'z' },
      { a: 'u', b: 'v', c: 'w' },
    ])
  })

  test('numeric and boolean cells keep their type', async () => {
    const { rows } = await readXlsx([
      ['a', 'b', 'c'],
      [1, 2.5, true],
    ])
    expect(rows).toEqual([{ a: 1, b: 2.5, c: true }])
  })

  test('trims headers and text cell values', async () => {
    const { headers, rows } = await readXlsx([
      [' a ', ' b '],
      ['  x  ', ' y '],
    ])
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: 'x', b: 'y' }])
  })

  test('empty cells are read as empty strings', async () => {
    const { rows } = await readXlsx([
      ['a', 'b', 'c'],
      ['x', null, 'z'],
      [null, null, 'w'],
    ])
    expect(rows).toEqual([
      { a: 'x', b: '', c: 'z' },
      { a: '', b: '', c: 'w' },
    ])
  })

  test('cells after the last header column are ignored', async () => {
    const { headers, rows } = await readXlsx([
      ['a', 'b'],
      ['x', 'y', 'extra'],
    ])
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: 'x', b: 'y' }])
  })

  test('reads only the first worksheet', async () => {
    const { rows } = await readXlsx([['a'], ['first']], [['a'], ['second']])
    expect(rows).toEqual([{ a: 'first' }])
  })

  test('a workbook with only the headers row has no data rows', async () => {
    const { headers, rows } = await readXlsx([['a', 'b']])
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([])
  })

  test('reports the total number of rows', async () => {
    let total = 0
    const reader = FlatDataReader.createReaderFromStream({
      stream: Readable.from([await toXlsxBuffer([['a'], [1], [2], [3]])]),
      fileFormat: FileFormats.xlsx,
      onTotalChange: (t: number) => {
        total = t
      },
    })
    await reader.start()
    expect(total).toBe(4) // headers row included
  })
})
