import { Readable } from 'node:stream'
import ExcelJS from 'exceljs'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { FileFormats } from '@core/fileFormats'

import { DataImportFlatDataFileReader } from '@server/modules/dataImport/service/DataImportJob/dataImportFlatDataFileReader'
import * as FlatDataReader from '@server/utils/file/flatDataReader'

import * as SB from './surveyBuilder'

export type Cell = string | number | boolean | Date | null
export type Rows = Cell[][] // first row: headers

export type FlatDataFileFormat = typeof FileFormats.csv | typeof FileFormats.xlsx

export const fileFormats: FlatDataFileFormat[] = [FileFormats.csv, FileFormats.xlsx]

const csvCellToString = (cell: Cell): string => {
  if (cell === null || cell === undefined) return ''
  const str = String(cell)
  return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str
}

export const toCsvContent = (rows: Rows): string => rows.map((row) => row.map(csvCellToString).join(',')).join('\n')

const createWorkbook = (...sheetsRows: Rows[]) => {
  const workbook = new ExcelJS.Workbook()
  sheetsRows.forEach((rows, index) => {
    const worksheet = workbook.addWorksheet(`Sheet${index + 1}`)
    rows.forEach((row) => worksheet.addRow(row))
  })
  return workbook
}

/**
 * Generates the content of an Excel (xlsx) file; every argument is the list of rows of a worksheet.
 * @param {...Rows} sheetsRows - The rows of every worksheet.
 * @returns {Promise<Buffer>} - The xlsx file content.
 */
export const toXlsxBuffer = async (...sheetsRows: Rows[]): Promise<Buffer> =>
  Buffer.from(await createWorkbook(...sheetsRows).xlsx.writeBuffer())

/**
 * Generates the content of a file in the specified format.
 * @param {object} params - The parameters.
 * @param {FlatDataFileFormat} params.fileFormat - The file format (csv or xlsx).
 * @param {Rows} params.rows - The rows (first row: headers).
 * @returns {Promise<string|Buffer>} - The file content.
 */
export const toFileContent = async ({ fileFormat, rows }: { fileFormat: FlatDataFileFormat; rows: Rows }) =>
  fileFormat === FileFormats.xlsx ? toXlsxBuffer(rows) : toCsvContent(rows)

export const createStream = async ({ fileFormat, rows }: { fileFormat: FlatDataFileFormat; rows: Rows }) =>
  Readable.from([await toFileContent({ fileFormat, rows })])

/**
 * Reads the headers and rows of a stream using the flat data reader.
 * @param {object} params - The parameters.
 * @param {Readable} params.stream - The input stream.
 * @param {FlatDataFileFormat} params.fileFormat - The file format (csv or xlsx).
 * @returns {Promise<{headers: string[], rows: object[]}>} - The headers and the rows (objects indexed by header).
 */
export const readHeadersAndRows = async ({ stream, fileFormat }: { stream: Readable; fileFormat: string }) => {
  let headers: string[] = []
  const rows: any[] = []
  const reader = FlatDataReader.createReaderFromStream({
    stream,
    fileFormat,
    onHeaders: async (headersRead: string[]) => {
      headers = headersRead
    },
    onRow: async (row: any) => {
      rows.push({ ...row })
    },
  })
  await reader.start()
  return { headers, rows }
}

/**
 * Builds (in memory) a survey with a root entity (cluster) and a multiple entity (plot) with attributes of several types.
 * @param {object} user - The user.
 * @returns {Promise<object>} - The survey.
 */
export const buildTestSurvey = async (user: any) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('plot_size', NodeDef.nodeDefType.decimal),
        SB.attribute('plot_accessible', NodeDef.nodeDefType.boolean),
        SB.attribute('plot_visit_date', NodeDef.nodeDefType.date),
        SB.attribute('plot_status', NodeDef.nodeDefType.code).category('plot_status'),
        SB.attribute('plot_remarks', NodeDef.nodeDefType.text)
      ).multiple()
    )
  )
    .categories(SB.category('plot_status').items(SB.categoryItem('A'), SB.categoryItem('B')))
    .build()

/**
 * Reads the rows of a file (in the specified format) using the reader used by the data import job
 * (rows converted into node values).
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.entityName - The name of the entity where data will be imported.
 * @param {FlatDataFileFormat} params.fileFormat - The file format (csv or xlsx).
 * @param {Rows} params.rows - The rows (first row: headers).
 * @returns {Promise<object[]>} - The items read (valuesByDefUuid, refDataByDefUuid, errors), one for every data row.
 */
export const readRowItems = async ({
  survey,
  entityName,
  fileFormat,
  rows,
}: {
  survey: any
  entityName: string
  fileFormat: FlatDataFileFormat
  rows: Rows
}) => {
  const items: any[] = []
  const reader = DataImportFlatDataFileReader.createReaderFromStream({
    stream: await createStream({ fileFormat, rows }),
    fileFormat,
    survey,
    // items not found in the survey index are looked up in the DB by the default provider: stub it
    categoryItemProvider: { getItemByCodePaths: async () => null },
    taxonProvider: { getTaxonByCode: async () => null },
    cycle: Survey.cycleOneKey,
    nodeDefUuid: NodeDef.getUuid(Survey.getNodeDefByName(entityName)(survey)),
    onRowItem: async (item: any) => {
      items.push(item)
    },
  })
  await reader.start()
  return items
}
