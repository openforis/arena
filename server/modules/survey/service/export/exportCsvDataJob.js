import Job from '@server/job/job'

import CSVDataExtraction from './jobs/CSVDataExtraction'

export default class ExportCsvDataJob extends Job {
  constructor(params) {
    super(ExportCsvDataJob.type, params, [new CSVDataExtraction()])
  }

  async onStart() {
    await super.onStart()
  }

  async beforeSuccess() {
    const { exportDataFolderName } = this.context

    this.setResult({
      exportDataFolderName,
    })
  }

  async onEnd() {
    await super.onEnd()
  }
}

ExportCsvDataJob.type = 'ExportCsvDataJob'
