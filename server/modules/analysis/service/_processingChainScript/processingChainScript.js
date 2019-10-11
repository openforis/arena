const R = require('ramda')
const CSVWriter = require('../../../../utils/file/csvWriter')

const generate = async (survey, processingChain, data) => {
  // write data to csv

  const headers = R.pipe(R.head, R.keys)(data)
  const rows = R.pipe(R.map, R.values)(data)



  // create main script

  //
}

module.exports = {
  generate
}