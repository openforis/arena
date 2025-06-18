import ExcelJS from 'exceljs'

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
      headers = []
      row.eachCell((cell) => {
        headers.push(cell.value)
      })
      rows.push(headers)
    } else {
      const rowValues = []
      headers.forEach((_header, index) => {
        const cell = row.getCell(index + 1)
        const cellValue = cell?.value ?? '' // null values considered as empty strings
        rowValues.push(cellValue)
      })
      rows.push(rowValues)
    }
  })
  return rows
}

export const ExcelReader = {
  extractRowsFromExcelStream,
}
