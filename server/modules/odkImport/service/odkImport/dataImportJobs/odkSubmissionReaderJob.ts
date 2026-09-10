import Job from '@server/job/job'
import FileZip from '@server/utils/file/fileZip'

const submissionFileName = 'submission.xml'

/**
 * Opens the uploaded ODK Briefcase-style export zip (one `<instanceId>/submission.xml` + media per
 * submission) and enumerates every submission entry, storing the open zip handle and entry list in the
 * job context for RecordsImportJob. Mirrors collectImport's CollectSurveyReaderJob (open once, read
 * many) rather than extracting to disk - same streaming-entry-read convention `FileZip` establishes.
 */
export default class OdkSubmissionReaderJob extends Job {
  static readonly type = 'OdkSubmissionReaderJob'

  constructor(params?: any) {
    super(OdkSubmissionReaderJob.type, params)
  }

  async execute() {
    const filePath = this.getContextProp('filePath')

    const submissionFileZip = new FileZip(filePath)
    await submissionFileZip.init()

    const allEntryNames: string[] = submissionFileZip.getEntryNames({ onlyFirstLevel: false })
    const submissionEntryNames = allEntryNames.filter((name: string) => name.endsWith(`/${submissionFileName}`))

    this.setContext({ submissionFileZip, submissionEntryNames })
  }
}
