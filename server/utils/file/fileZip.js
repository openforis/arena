import StreamZip from 'node-stream-zip'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as Log from '@server/log/log'

const hiddenFilePaths = ['__MACOSX']

export default class FileZip {
  constructor(file) {
    this.file = file
    this.streamZip = null // To be initialized in init method
    this.logger = Log.getLogger('FileZip')
  }

  async init() {
    return new Promise((resolve, reject) => {
      const streamZip = new StreamZip({
        file: this.file,
        storeEntries: true,
      })

      streamZip.on('ready', () => {
        resolve()
      })

      // Handle errors
      streamZip.on('error', (err) => {
        this.logger.error(`Error initializing stream: ${err}`)
        reject(err)
      })

      this.streamZip = streamZip
    })
  }

  extract(path) {
    return new Promise((resolve, reject) =>
      this.streamZip.extract(null, path, (err, count) => {
        return err ? reject(err) : resolve(count)
      })
    )
  }

  hasEntry(entryName) {
    return Boolean(this.streamZip.entry(entryName))
  }

  getEntryData(entryName) {
    return this.hasEntry(entryName) ? this.streamZip.entryDataSync(entryName) : null
  }

  getEntryAsText(entryName) {
    const data = this.getEntryData(entryName)
    return data ? data.toString('utf8') : null
  }

  async getEntryStream(entryName) {
    return this.hasEntry(entryName)
      ? new Promise((resolve, reject) =>
          this.streamZip.stream(entryName, (err, stm) => (err ? reject(err) : resolve(stm)))
        )
      : null
  }

  getEntryNames({ path = '', excludeHiddenFiles = true, excludeDirectories = true, onlyFirstLevel = true } = {}) {
    const entries = this.streamZip.entries()
    return Object.values(entries).reduce((acc, entry) => {
      const { name, isDirectory } = entry
      if (
        (excludeDirectories && isDirectory) ||
        (excludeHiddenFiles && hiddenFilePaths.find((hiddenFilePath) => name.startsWith(hiddenFilePath)))
      ) {
        return acc
      }
      if (path) {
        if (name.startsWith(path)) {
          acc.push(name.slice(path.length))
        }
      } else if (!onlyFirstLevel || name.split('/').length === 1) {
        acc.push(name)
      }
      return acc
    }, [])
  }

  close() {
    this.streamZip?.close()
  }
}

export const extractZip = async (src, extractedPath) => {
  // the clean and create the destination folder
  await FileUtils.rmdir(extractedPath)
  await FileUtils.mkdir(extractedPath)

  let fileZip = null
  try {
    fileZip = new FileZip(src)
    await fileZip.init()
    await fileZip.extract(extractedPath)
  } finally {
    fileZip?.close()
  }
}
