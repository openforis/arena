const R = require('ramda')
const StreamZip = require('node-stream-zip')

const Log = require('../../log/log')

class FileZip {

  constructor (file) {
    this.file = file
    this.streamZip = null // to be initialized in init method
    this.logger = Log.getLogger('FileZip')
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
      streamZip.on('error', err => {
        this.logger.error(`Error initializing stream: ${err}`)
        reject(err)
      })

      this.streamZip = streamZip
    })
  }

  getEntryData (entryName) {
    try {
      return this.streamZip.entryDataSync(entryName)
    } catch(e) {
      // entry not found
      return null
    }
  }

  getEntryAsText (entryName) {
    const data = this.getEntryData(entryName)
    return data ? data.toString('utf8') : null
  }

  async getEntryStream (entryName) {
    return new Promise(resolve =>
      this.streamZip.stream(entryName, (err, stm) => resolve(stm))
    )
  }

  getEntryNames (path = '') {
    return R.pipe(
      R.filter(
        R.propEq('isDirectory', false)
      ),
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