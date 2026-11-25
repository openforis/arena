import type { Readable } from 'node:stream'
import StreamZip from 'node-stream-zip'

import * as Log from '@server/log/log'
import * as FileUtils from '@server/utils/file/fileUtils'

const hiddenFilePaths = ['__MACOSX']

type EntryNamesParams = {
  // entries in this folder (path prefix removed from the names)
  path?: string
  excludeHiddenFiles?: boolean
  excludeDirectories?: boolean
  onlyFirstLevel?: boolean
}

export default class FileZip {
  readonly file: string
  private streamZip: StreamZip | null
  private readonly logger: Log.Logger

  constructor(file: string) {
    this.file = file
    this.streamZip = null // To be initialized in init method
    this.logger = Log.getLogger('FileZip')
  }

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
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

  extract(path: string): Promise<number | undefined> {
    return new Promise((resolve, reject) =>
      this.streamZip.extract(null, path, (err, count) => {
        return err ? reject(err) : resolve(count)
      })
    )
  }

  hasEntry(entryName: string): boolean {
    return Boolean(this.streamZip.entry(entryName))
  }

  getEntryData(entryName: string): Buffer | null {
    return this.hasEntry(entryName) ? this.streamZip.entryDataSync(entryName) : null
  }

  getEntryAsText(entryName: string): string | null {
    const data = this.getEntryData(entryName)
    return data ? data.toString('utf8') : null
  }

  async getEntryStream(entryName: string): Promise<Readable | null> {
    return this.hasEntry(entryName)
      ? new Promise<Readable>((resolve, reject) =>
          // node-stream-zip declares NodeJS.ReadableStream, but returns a Readable
          this.streamZip.stream(entryName, (err, stm) => (err ? reject(err) : resolve(stm as Readable)))
        )
      : null
  }

  getEntryNames({
    path = '',
    excludeHiddenFiles = true,
    excludeDirectories = true,
    onlyFirstLevel = true,
  }: EntryNamesParams = {}): string[] {
    const names: string[] = []
    for (const { name, isDirectory } of Object.values(this.streamZip.entries())) {
      const excluded =
        (excludeDirectories && isDirectory) ||
        (excludeHiddenFiles && hiddenFilePaths.some((hiddenFilePath) => name.startsWith(hiddenFilePath)))
      if (excluded) continue
      if (path) {
        if (name.startsWith(path)) {
          names.push(name.slice(path.length))
        }
      } else if (!onlyFirstLevel || name.split('/').length === 1) {
        names.push(name)
      }
    }
    return names
  }

  close(): void {
    this.streamZip?.close()
  }
}

export const extractZip = async (src: string, extractedPath: string): Promise<void> => {
  // clean and create the destination folder
  await FileUtils.rmdir(extractedPath)
  await FileUtils.mkdir(extractedPath)

  let fileZip: FileZip | null = null
  try {
    fileZip = new FileZip(src)
    await fileZip.init()
    await fileZip.extract(extractedPath)
  } finally {
    fileZip?.close()
  }
}
