import Job from '@server/job/job'

import { ZipArchiver } from '@server/utils/file/ZipArchiver'

import CSVDataExtractionJob from './jobs/CSVDataExtractionJob'
import CategoriesExportJob from './jobs/CategoriesExportJob'

const createInternalJobs = ({ includeCategories }) => [
  new CSVDataExtractionJob(),
  ...(includeCategories ? [new CategoriesExportJob()] : []),
]

export default class ExportCsvDataJob extends Job {
  constructor(params) {
    super(ExportCsvDataJob.type, params, createInternalJobs(params))
  }

  async onStart() {
    await super.onStart()

    // exportUuid will be used when dowloading the generated output file
    const exportUuid = this.uuid

    // the generated zip file will be named `${exportUuid}.zip`
    const outputFileName = `${exportUuid}.zip`

    const archiver = new ZipArchiver(outputFileName)

    this.setContext({
      exportUuid,
      archiver,
    })
  }

  async beforeSuccess() {
    const { archiver, exportUuid } = this.context

    await archiver.finalize()

    this.setResult({
      exportUuid,
    })
  }
}

ExportCsvDataJob.type = 'ExportCsvDataJob'
