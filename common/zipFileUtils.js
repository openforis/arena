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
  })

const readEntry = async (zip, entryName) => {
  const data = await zip.entryDataSync(entryName)
  return data.toString('utf8')
}

module.exports = {
  openFile,
  readEntry
}