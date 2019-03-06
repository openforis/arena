const R = require('ramda')

const StreamZip = require('node-stream-zip')

class FileZip {

  constructor (file) {
    this.file = file
    this.zip = null // to be initialized in init method
  }

  async init () {
    return new Promise((resolve, reject) => {
      const zip = new StreamZip({
        file: this.file,
        storeEntries: true
      })

      zip.on('ready', () => {
        resolve()
      })

      // Handle errors
      zip.on('error', err => console.log(err) || reject(err))

      this.zip = zip
    })
  }

  getEntryData (entryName) {
    return this.zip.entryDataSync(entryName)
  }

  getEntryAsText (entryName) {
    const data = this.getEntryData(entryName)
    return data.toString('utf8')
  }

  async getEntryStream (entryName) {
    return new Promise(resolve =>
      this.zip.stream(entryName, (err, stm) => resolve(stm))
    )
  }

  getEntryNames (path = '') {
    return R.pipe(
      R.keys,
      R.filter(R.startsWith(path)),
      R.map(entry => entry.substring(path.length))
    )(this.zip.entries())
  }

  close () {
    this.zip.close()
  }
}

module.exports = FileZip