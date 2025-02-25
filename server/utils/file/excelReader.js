import ExcelJS from 'exceljs'

const extractRowsFromExcelStream = async ({ stream }) => {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.read(stream)

  // read only first worksheet
  const worksheet = workbook.getWorksheet(1)

  if (!worksheet) return []

  const rows = []

  worksheet.eachRow((row) => {
    const rowValues = []
    row.eachCell((cell) => {
      rowValues.push(cell.value)
    })
    rows.push(rowValues)
  })
  return rows
}

export const ExcelReader = {
  extractRowsFromExcelStream,
}
