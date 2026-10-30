import ExcelJS from 'exceljs'

/**
 * Converts an exceljs cell value into a plain value: formula, rich text, hyperlink and error cells are objects.
 * @param {*} value - The exceljs cell value.
 * @returns {*} The plain value (the value itself if it is already plain).
 */
const toPlainValue = (value) => {
  if (value?.richText) return value.richText.map(({ text }) => text).join('')
  if (value?.hyperlink) return toPlainValue(value.text)
  if (value?.error) return value.error
  if (value?.formula || value?.sharedFormula) return toPlainValue(value.result)
  return value
}

// cell.value drops falsy formula results and merged cells have no result of their own: read it from the master cell
const extractCellValue = (cell) => toPlainValue(cell.master.result ?? cell.value) ?? '' // null values considered as empty strings

const extractRowValues = (row) => {
  const values = []
  row.eachCell((cell) => {
    values.push(extractCellValue(cell))
  })
  return values
}

const extractRowValuesFixed = (row, cellsCount) => {
  const values = []
  for (let index = 0; index < cellsCount; index++) {
    values.push(extractCellValue(row.getCell(index + 1)))
  }
  return values
}

const extractRowsFromExcelStream = async ({ stream }) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.read(stream)

  // read only first worksheet
  const worksheet = workbook.worksheets[0]

  if (!worksheet) return []

  const rows = []
  let headers = null
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      headers = extractRowValues(row)
      rows.push(headers)
    } else {
      const rowValues = extractRowValuesFixed(row, headers.length)
      rows.push(rowValues)
    }
  })
  return rows
}

export const ExcelReader = {
  extractRowsFromExcelStream,
  toPlainValue,
}
