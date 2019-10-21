import { parseFile, parseStream } from 'fast-csv'
import { is } from 'ramda'

export default class CSVParser {
  _filePathOrStream: any
  _csvStream: any
  _error: any
  _initialized: boolean = false
  _csvStreamEnded: boolean = false
  _rowReadyListener: ((row: any) => void) | null = null
  _destroyed: any
  _headers: any

  constructor (filePathOrStream) {
    this._reset()
    this._filePathOrStream = filePathOrStream
  }

  async init () {
    this._csvStream = this._createCsvStream({ headers: false })

    this._csvStream
      .on('data', data => this._onData(data))
      .on('end', () => this._onStreamEnd())
      .on('error', error => this._error = error)

    this._initialized = true
  }

  calculateSize () {
    return new Promise((resolve, reject) => {
      if (this._error) {
        reject(this._error)
      } else {
        let count = -1 //do not include headers
        // do not consume instance csv stream, create a new one
        this._createCsvStream({ headers: false })
          .on('data', () => count++)
          .on('end', () => resolve(count))
          .on('error', reject)
      }
    })
  }

  async next () {
    if (!this._initialized)
      throw new Error(`${this.constructor.name} not initialized yet`)

    return new Promise((resolve, reject) => {
        if (this._error) {
          reject(this._error)
        } else if (this._csvStreamEnded) {
          // stream ended; no new rows to read
          resolve(null)
        } else {
          // resume the stream and wait for a new row
          this._rowReadyListener = row => {
            this._rowReadyListener = null
            resolve(row)
          }
          this._csvStream.resume()
        }
      }
    )
  }

  destroy () {
    if (!this._destroyed && this._csvStream) {
      this._csvStream.destroy()
      this._reset()
      this._destroyed = true
    }
  }

  get headers () {
    return this._headers
  }

  get error () {
    return this._error
  }

  _createCsvStream (options) {
    return is(String, this._filePathOrStream)
      ? parseFile(this._filePathOrStream, options)
      : parseStream(this._filePathOrStream, options)
  }

  _onData (data) {
    this._csvStream.pause()

    if (this._headers === null) {
      this._headers = data
    } else {
      this._notifyRowReady(data)
    }
  }

  _notifyRowReady (row) {
    if (this._rowReadyListener) {
      // index row data by headers
      const rowIndexed = this._headers.reduce((acc, header, index) => {
          acc[header] = row[index]
          return acc
        },
        {}
      )
      this._rowReadyListener(rowIndexed)
    }
  }

  _onStreamEnd () {
    this._csvStreamEnded = true
    this._notifyRowReady(null)
  }

  _reset () {
    this._csvStream = null
    this._csvStreamEnded = false
    this._destroyed = false
    this._error = null
    this._filePathOrStream = null
    this._headers = null
    this._initialized = false
    this._rowReadyListener = null
  }

}
