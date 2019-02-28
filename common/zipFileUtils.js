const R = require('ramda')

const StreamZip = require('node-stream-zip')

const openFile = async file =>
  new Promise((resolve, reject) => {

    const zip = new StreamZip({
      file,
      storeEntries: true
    })

    zip.on('ready', () => {
      resolve(zip)
    })

    // Handle errors
    zip.on('error', err => console.log(err) || reject(err))

    zip.en
  })

const getEntryData = (zip, entryName) => zip.entryDataSync(entryName)

const getEntryAsText = (zip, entryName) => {
  const data = getEntryData(zip, entryName)
  return data.toString('utf8')
}

const getEntryStream = (zip, entryName) => zip.stream(entryName)

const entries = (zip, path = '') => R.pipe(
  R.keys,
  R.filter(R.startsWith(path)),
  R.map(entry => entry.substring(path.length))
)(zip.entries())

module.exports = {
  openFile,
  getEntryData,
  getEntryAsText,
  getEntryStream,
  entries
}