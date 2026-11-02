import { ExportFile } from '@server/modules/survey/service/surveyExport/exportFile'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import RecordsImportJob from '@server/modules/mobile/service/arenaMobileDataImport/jobs/recordsImportJob'

const recordSummaries = [{ uuid: 'record-1' }, { uuid: 'record-2' }, { uuid: 'record-3' }]

const arenaSurveyFileZip = {
  getEntryData: async (entryName: string) => JSON.stringify(entryName === ExportFile.records ? recordSummaries : {}),
}

class RecordsImportJobTest extends (RecordsImportJob as any) {
  importedCount = 0

  // skips only the fetch of the existing records from the database
  async onStart() {
    await DataImportBaseJob.prototype.onStart.call(this)
  }

  async cleanupCurrentRecord() {
    // no database access
  }

  async insertOrSkipRecord() {
    this.importedCount += 1
    await this.cancel()
  }
}

describe('RecordsImportJob cancel', () => {
  test('records are not processed anymore after the job has been canceled', async () => {
    const job: any = new (RecordsImportJobTest as any)({ arenaSurveyFileZip })
    await job.start({ tx: async (fn: (tx: object) => Promise<void>) => fn({}) })

    expect(job.importedCount).toBe(1)
    expect(job.isCanceled()).toBe(true)
  })
})
