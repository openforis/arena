import type { Writable } from 'node:stream'
import { ZipArchive } from 'archiver'

export class ZipArchiver {
  private readonly archiver: ZipArchive

  constructor(outputStream: Writable) {
    this.archiver = new ZipArchive()
    this.archiver.pipe(outputStream)
  }

  addFile(path: string, entryName: string): void {
    this.archiver.file(path, { name: entryName })
  }

  addContent(content: string | Buffer | NodeJS.ReadableStream, entryName: string): void {
    this.archiver.append(content, { name: entryName })
  }

  async finalize(): Promise<void> {
    await this.archiver.finalize()
  }
}
