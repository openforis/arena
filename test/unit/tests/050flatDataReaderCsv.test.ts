import { Readable } from 'stream'

import { FileFormats } from '@core/fileFormats'

import * as FlatDataReader from '@server/utils/file/flatDataReader'

import { readHeadersAndRows } from '../../utils/flatDataImportTestUtils'

const readCsv = async (content: string) =>
  readHeadersAndRows({ stream: Readable.from([content]), fileFormat: FileFormats.csv })

describe('FlatDataReader (csv)', () => {
  test('reads headers and rows as objects', async () => {
    const { headers, rows } = await readCsv('a,b,c\n1,2,3\n4,5,6\n')
    expect(headers).toEqual(['a', 'b', 'c'])
    expect(rows).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ])
  })

  test('trims headers and cell values', async () => {
    const { headers, rows } = await readCsv(' a , b \n  x  , y \n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: 'x', b: 'y' }])
  })

  test('ignores empty lines and trailing empty header columns', async () => {
    const { headers, rows } = await readCsv('a,b,,\n1,2,,\n\n3,4,,\n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toHaveLength(2)
    expect(rows[1]).toEqual({ a: '3', b: '4' })
  })

  test('supports quoted values containing separators and new lines', async () => {
    const { rows } = await readCsv('a,b\n"x, y","line1\nline2"\n')
    expect(rows).toEqual([{ a: 'x, y', b: 'line1\nline2' }])
  })

  test('fails when an empty header is found between non-empty headers', async () => {
    await expect(readCsv('a,,c\n1,2,3\n')).rejects.toMatchObject({ key: 'appErrors:csv.emptyHeaderFound' })
  })

  test('ignores rows with only empty cells, even when they come first (the next row is used as headers)', async () => {
    const { headers, rows } = await readCsv(',,\na,b\n1,2\n')
    expect(headers).toEqual(['a', 'b'])
    expect(rows).toEqual([{ a: '1', b: '2' }])
  })

  test('stops reading when canceled', async () => {
    const rows: any[] = []
    const reader = FlatDataReader.createReaderFromStream({
      stream: Readable.from(['a\n1\n2\n3\n']),
      fileFormat: FileFormats.csv,
      onRow: async (row: any) => {
        rows.push({ ...row })
        reader.cancel()
      },
    })
    await reader.start().catch(() => {})
    expect(rows).toHaveLength(1)
  })
})
