import ExcelJS from 'exceljs'

import { Objects } from '@openforis/arena-core'

import { FlatDataWriterUtils } from './flatDataWriterUtils'

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
  items,
  fields = null,
  options = FlatDataWriterUtils.defaultOptions,
}) => {
  if (Objects.isEmpty(items) || Objects.isEmpty(items[0])) return null

  const { objectTransformer = null } = options
  const itemTransformer = objectTransformer ?? FlatDataWriterUtils.defaultObjectTransformer(options)

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
    },
  })

  worksheet.columns = (fields ?? Object.keys(items[0])).map((field) => ({
    header: field,
    key: field,
  }))

  // set style to header row
  worksheet.getRow(1).eachCell((cell) => {
    cell.style = headerCellStyle
  })

  // loop over the items
  items.forEach((item) => {
    const transformedItem = itemTransformer(item)
    worksheet.addRow(transformedItem)
  })

  //   // Loop through all cells and apply the border style
  worksheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = cellBorder
    })
  })

  worksheet.columns.forEach((column) => {
    let maxLength = 0
    column['eachCell']({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = maxLength < 10 ? 10 : maxLength
  })

  return workbook.xlsx.write(outputStream)
}
