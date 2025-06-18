import ExcelJS from 'exceljs'

import { Objects } from '@openforis/arena-core'

import { FlatDataWriterUtils } from './flatDataWriterUtils'
import { CsvField } from './csvField'

const headerCellStyle = { font: { bold: true } }

const cellBorderStyle = {
  style: 'thin',
  color: { argb: '00000000' },
}

const cellBorder = {
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
}) => {
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
    type: field?.type ?? 'string',
  }))

  // set style to header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerCellStyle
  })

  // loop over the items
  items.forEach((item) => {
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
  })

  // set column widths based on the content
  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value?.toString().length ?? 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength
  })

  return workbook.xlsx.write(outputStream)
}
