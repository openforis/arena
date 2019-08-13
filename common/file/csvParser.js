const fastcsv = require('fast-csv')
const R = require('ramda')

class CSVParser {

  constructor (filePathOrStream, readHeaders = true) {
    this.destroyed = false
    this.csvStreamEnded = false
    this.filePathOrStream = filePathOrStream
    this.readHeaders = readHeaders
    this.rowReadyListener = null
    this.error = null
    this.initialized = false
  }

  init () {
    this.csvStream = this._createCsvStream({ headers: this.readHeaders })

    this.csvStream
      .on('data', data => this._onData(data))
      .on('end', () => this._onStreamEnd())
      .on('error', error => this.error = error)
      .pause()

    this.initialized = true
  }

  calculateSize () {
    return new Promise((resolve, reject) => {
      if (this.error)
        reject(this.error)

      let count = 0
      // do not consume instance csv stream, create a new one
      this._createCsvStream({ headers: true })
        .on('data', () => count++)
        .on('end', () => resolve(count))
        .on('error', reject)
    })
  }

  async next () {
    if (!this.initialized)
      throw new Error(`${this.constructor.name} not initialized yet`)

    return new Promise((resolve, reject) => {
      if (this.error)
        reject(this.error)

      if (this.csvStreamEnded)
        resolve(null)

      this.rowReadyListener = row => {
        this.rowReadyListener = null
        resolve(row)
      }
      this.csvStream.resume()
    })
  }

  destroy () {
    if (!this.destroyed && this.csvStream) {
      this.csvStream.destroy()
      this.csvStream = null
      this.filePath = null
      this.rowReadyListener = null
      this.destroyed = true
    }
  }

  _createCsvStream (options) {
    return R.is(String, this.filePathOrStream)
      ? fastcsv.parseFile(this.filePathOrStream, options)
      : fastcsv.parseStream(this.filePathOrStream, options)
  }

  _onData (data) {
    this.csvStream.pause()

    this._notifyRowReady(data)
  }

  _notifyRowReady (row) {
    if (this.rowReadyListener)
      this.rowReadyListener(row)
  }

  _onStreamEnd () {
    this.csvStreamEnded = true

    this._notifyRowReady(null)
  }

}

module.exports = CSVParser