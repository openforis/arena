import { ZipArchive } from 'archiver'

export class ZipArchiver {
  constructor(outputStream) {
    this.archiver = new ZipArchive()
    this.archiver.pipe(outputStream)
  }

  addFile(path, entryName) {
    this.archiver.file(path, { name: entryName })
  }

  addContent(content, entryName) {
    this.archiver.append(content, { name: entryName })
  }

  async finalize() {
    await this.archiver.finalize()
  }
}
