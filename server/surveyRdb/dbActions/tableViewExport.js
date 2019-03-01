const R = require('ramda')
const fastcsv = require('fast-csv')

const TableViewQuery = require('./tableViewQuery')

const exportToCSV = async (surveyId, tableName, cols, filter, sort, output, client) => {
  const csvStream = fastcsv.createWriteStream({ headers: true })
  csvStream.pipe(output)

  // 1. write headers
  csvStream.write(cols)

  let offset = 0
  const limit = 500
  let complete = false

  // 2. write rows
  while (!complete) {
    const rows = await TableViewQuery.runSelect(surveyId, tableName, cols, offset, limit, filter, sort, client)

    rows.forEach(row => {
      csvStream.write(R.values(row))
    })

    offset = offset + limit
    if (rows.length < limit)
      complete = true
  }

  // 3. close stream
  csvStream.end()
}

module.exports = {
  exportToCSV
}