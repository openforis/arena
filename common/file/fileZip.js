const R = require('ramda')

const StreamZip = require('node-stream-zip')

class FileZip {

  constructor (file) {
    this.file = file
    this.streamZip = null // to be initialized in init method
  }

  async init () {
    return new Promise((resolve, reject) => {
      const streamZip = new StreamZip({
        file: this.file,
        storeEntries: true
      })

      streamZip.on('ready', () => {
        resolve()
      })

      // Handle errors
      streamZip.on('error', err => console.log(err) || reject(err))

      this.streamZip = streamZip
    })
  }

  getEntryData (entryName) {
    return this.streamZip.entryDataSync(entryName)
  }

  getEntryAsText (entryName) {
    const data = this.getEntryData(entryName)
    return data.toString('utf8')
  }

  async getEntryStream (entryName) {
    return new Promise(resolve =>
      this.streamZip.stream(entryName, (err, stm) => resolve(stm))
    )
  }

  getEntryNames (path = '') {
    return R.pipe(
      R.keys,
      R.filter(R.startsWith(path)),
      R.map(entry => entry.substring(path.length))
    )(this.streamZip.entries())
  }

  close () {
    this.streamZip.close()
  }
}

module.exports = FileZip