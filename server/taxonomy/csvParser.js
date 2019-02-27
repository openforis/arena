const fastcsv = require('fast-csv')

class CSVParser {

  constructor (filePath, readHeaders = true) {
    this.destroyed = false
    this.csvStreamEnded = false
    this.filePath = filePath
    this.rowReadyListener = null

    this.csvStream = fastcsv.fromPath(this.filePath, {headers: readHeaders})
      .on('data', data => this.onData(data))
      .on('end', () => this.onStreamEnd())
      .pause()
  }

  calculateSize () {
    return new Promise(resolve => {
      let count = 0
      fastcsv.fromPath(this.filePath, {headers: true})
        .on('data', () => count++)
        .on('end', () => resolve(count))
    })
  }

  onData (data) {
    this.csvStream.pause()

    this.notifyRowReady(data)
  }

  notifyRowReady (row) {
    if (this.rowReadyListener)
      this.rowReadyListener(row)
  }

  onStreamEnd () {
    this.csvStreamEnded = true
  }

  async next () {
    return new Promise(resolve => {
      if (this.csvStreamEnded) {
        resolve(null)
      } else {
        this.rowReadyListener = row => {
          this.rowReadyListener = null
          resolve(row)
        }
        this.csvStream.resume()
      }
    })
  }

  destroy () {
    if (!this.destroyed) {
      this.csvStream.destroy()
      this.csvStream = null
      this.filePath = null
      this.rowReadyListener = null
      this.destroyed = true
    }
  }
}

module.exports = CSVParser