import ExcelJS from 'exceljs'

import { Objects } from '@openforis/arena-core'

import type { Writable } from 'node:stream'

import { FlatDataWriterOptions, FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField, CsvFieldItem } from './csvField'
import { StreamUtils } from '../streamUtils'

const headerCellStyle: Partial<ExcelJS.Style> = { font: { bold: true } }

const cellBorderStyle: Partial<ExcelJS.Border> = {
  style: 'thin',
  color: { argb: '00000000' },
}

const cellBorder: Partial<ExcelJS.Borders> = {
  bottom: cellBorderStyle,
  left: cellBorderStyle,
  right: cellBorderStyle,
  top: cellBorderStyle,
}

export const writeItemsToStream = async ({
  outputStream,
  items = [],
  fields = null,
  options = FlatDataWriterUtils.defaultOptions,
}: {
  outputStream: Writable
  items?: Record<string, any>[]
  fields?: CsvFieldItem[] | null
  options?: FlatDataWriterOptions
}): Promise<void | null> => {
  if (Objects.isEmpty(fields) && (Objects.isEmpty(items) || Objects.isEmpty(items[0]))) return null

  const { objectTransformer = null } = options
  const itemTransformer = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
    },
  })

  const actualFields = fields ?? Object.keys(items[0])
  const fieldNames = CsvField.getNames(actualFields)

  worksheet.columns = fieldNames.map((field) => ({
    header: field,
    key: field,
  }))

  // set style to header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerCellStyle
  })

  // loop over the items
  for (const item of items) {
    const transformedItem = itemTransformer(item)
    const row = worksheet.addRow(transformedItem)
    // apply border style
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = cellBorder
      // convert number fields to actual numbers
      if (cell.value) {
        const field = actualFields[colNumber - 1] // colNumber starts from 1
        const fieldType = CsvField.getType(field)
        if (fieldType === 'number') {
          cell.value = Number(cell.value)
        }
      }
    })
  }

  // set column widths based on the content
  for (const column of worksheet.columns) {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value?.toString().length ?? 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = Math.max(10, maxLength)
  }

  const outputCompletePromise = StreamUtils.waitForWritableStreamComplete(outputStream)
  // wait for both the workbook to be written and the output stream to be complete
  const [, outputCompleteResult] = await Promise.all([workbook.xlsx.write(outputStream), outputCompletePromise])
  return outputCompleteResult
}
