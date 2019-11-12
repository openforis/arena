import * as R from 'ramda'
import StreamZip from 'node-stream-zip'

import * as Log from '@server/log/log'

export default class FileZip {

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

  hasEntry (entryName) {
    return !!this.streamZip.entry(entryName)
  }

  getEntryData (entryName) {
    return this.hasEntry(entryName)
      ? this.streamZip.entryDataSync(entryName)
      : null
  }

  getEntryAsText (entryName) {
    const data = this.getEntryData(entryName)
    return data ? data.toString('utf8') : null
  }

  async getEntryStream (entryName) {
    return this.hasEntry(entryName)
      ? new Promise((resolve, reject) =>
        this.streamZip.stream(entryName, (err, stm) =>
          err
            ? reject(err)
            : resolve(stm)
        )
      )
      : null
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
