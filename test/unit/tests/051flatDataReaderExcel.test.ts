import { Readable } from 'stream'
import ExcelJS from 'exceljs'

import { FileFormats } from '@core/fileFormats'

import * as FlatDataReader from '@server/utils/file/flatDataReader'

import { Cell, readHeadersAndRows, toXlsxBuffer, Rows } from '../../utils/flatDataImportTestUtils'

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

  test('formula cells are read as their result', async () => {
    const { rows } = await readXlsx([
      ['a', 'b', 'c', 'd', 'e'],
      [
        { formula: 'LEFT("Abies alba",5)', result: 'Abies' },
        { formula: '1+1', result: 2 },
        { formula: '1-1', result: 0 },
        { formula: 'NA()', result: { error: '#N/A' } },
        { formula: 'A1' },
      ] as Cell[],
    ])
    expect(rows).toEqual([{ a: 'Abies', b: 2, c: 0, d: '#N/A', e: '' }])
  })

  test('shared formula cells are read as their result', async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')
    worksheet.addRow(['a'])
    worksheet.getCell('A2').value = {
      formula: 'LEFT("Abies",1)',
      result: 'A',
      shareType: 'shared',
      ref: 'A2:A3',
    } as ExcelJS.CellFormulaValue
    worksheet.getCell('A3').value = { sharedFormula: 'A2', result: 'B' } as ExcelJS.CellSharedFormulaValue
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

    const { rows } = await readHeadersAndRows({ stream: Readable.from([buffer]), fileFormat: FileFormats.xlsx })

    expect(rows).toEqual([{ a: 'A' }, { a: 'B' }])
  })

  test('rich text and hyperlink cells are read as their text, also in the headers', async () => {
    const { headers, rows } = await readXlsx([
      [{ richText: [{ text: 'sci' }, { text: 'name' }] }, 'b'],
      [
        { richText: [{ text: 'Ulmus ' }, { font: { italic: true }, text: 'minor' }] },
        { text: 'link', hyperlink: 'http://x.org' },
      ],
    ])
    expect(headers).toEqual(['sciname', 'b'])
    expect(rows).toEqual([{ sciname: 'Ulmus minor', b: 'link' }])
  })

  test('merged cells are read as the value of the master cell', async () => {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')
    worksheet.addRow(['a', 'b'])
    worksheet.addRow([{ formula: '1-1', result: 0 }, 'x'])
    worksheet.addRow([null, 'y'])
    worksheet.mergeCells('A2:A3')
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())

    const { rows } = await readHeadersAndRows({ stream: Readable.from([buffer]), fileFormat: FileFormats.xlsx })

    expect(rows).toEqual([
      { a: 0, b: 'x' },
      { a: 0, b: 'y' },
    ])
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
