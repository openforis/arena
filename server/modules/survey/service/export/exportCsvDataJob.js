import Job from '@server/job/job'

import * as FileUtils from '@server/utils/file/fileUtils'

import CSVDataExtractionJob from './jobs/CSVDataExtractionJob'
import CategoriesExportJob from './jobs/CategoriesExportJob'
import ZipCreationJob from './jobs/ZipCreationJob'

const createInternalJobs = ({ includeCategories }) => [
  new CSVDataExtractionJob(),
  ...(includeCategories ? [new CategoriesExportJob()] : []),
  new ZipCreationJob(),
]

export default class ExportCsvDataJob extends Job {
  constructor(params) {
    super(ExportCsvDataJob.type, params, createInternalJobs(params))
  }

  async onStart() {
    await super.onStart()

    // exportUuid will be used when dowloading the generated output file
    // the generated zip file will be named `${exportUuid}.zip`
    const exportUuid = this.uuid
    // use job uuid as temp folder name
    const outputDir = FileUtils.tempFilePath(exportUuid)

    // delete output dir if already existing (it shouldn't be possible...)
    await FileUtils.rmdir(outputDir)

    await FileUtils.mkdir(outputDir)

    this.setContext({
      exportUuid,
      outputDir,
    })
  }

  async beforeSuccess() {
    const { exportUuid } = this.context

    this.setResult({
      exportUuid,
    })
  }
}

ExportCsvDataJob.type = 'ExportCsvDataJob'
