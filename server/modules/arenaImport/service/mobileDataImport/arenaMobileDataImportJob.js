import Job from '@server/job/job'
import RecordsImportJob from './jobs/recordsImportJob'
import FilesImportJob from '../arenaImport/jobs/filesImportJob'

export default class ArenaMobileDataImportJob extends Job {
  /**
   * Creates a new data import job to import survey records and files in Arena format.
   *
   * @param {!object} params - The import parameters.
   * @param {!string} [params.filePath] - The file path of the file to import.
   * @param {!object} [params.user] - The user performing the import.
   * @returns {ArenaMobileDataImportJob} - The import job.
   */
  constructor(params) {
    super(ArenaMobileDataImportJob.type, params, [new RecordsImportJob(), new FilesImportJob()])
  }
}

ArenaMobileDataImportJob.type = 'ArenaMobileDataImportJob'
