const fastcsv = require('fast-csv')
const R = require('ramda')

class CSVParser {

  constructor (filePathOrStream, readHeaders = true) {
    this.destroyed = false
    this.csvStreamEnded = false
    this.filePathOrStream = filePathOrStream
    this.rowReadyListener = null

    const options = { headers: readHeaders }

    this.csvStream = R.is(String, filePathOrStream)
      ? fastcsv.parseFile(filePathOrStream, options)
      : fastcsv.parseStream(filePathOrStream, options)

    this.csvStream
      .on('data', data => this.onData(data))
      .on('end', () => this.onStreamEnd())
      .pause()
  }

  calculateSize () {
    return new Promise(resolve => {
      let count = 0
      fastcsv.parseFile(this.filePathOrStream, { headers: true })
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

    this.notifyRowReady(null)
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