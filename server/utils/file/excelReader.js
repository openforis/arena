import ExcelJS from 'exceljs'

const extractRowValues = (row) => {
  const values = []
  row.eachCell((cell) => {
    values.push(cell.value)
  })
  return values
}

const extractRowValuesFixed = (row, cellsCount) => {
  const rowValues = []
  for (let index = 0; index < cellsCount; index++) {
    const cell = row.getCell(index + 1)
    const cellValue = cell?.value ?? '' // null values considered as empty strings
    rowValues.push(cellValue)
  }
  return rowValues
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
}
