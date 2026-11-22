import type { ArenaJobContext } from '@openforis/arena-core'

import type * as RecordManager from '@server/modules/record/manager/recordManager'
import type FileZip from '@server/utils/file/fileZip'

import type { UploadedRecordInfo } from '../recordsUploadedFromMobileEmail'

type RecordsSummaryList = Awaited<ReturnType<typeof RecordManager.fetchRecordsSummaryBySurveyId>>['list']

/**
 * Context shared by the Arena Mobile data import (and import summary) jobs.
 */
export interface ArenaMobileDataImportJobContext extends ArenaJobContext {
  filePath?: string
  fileId?: string
  arenaSurveyFileZip?: FileZip
  existingRecordsSummary?: RecordsSummaryList
  conflictResolutionStrategy?: string
  selectedRecordsUuids?: string[]
  reuseUploadedFile?: boolean
  notifyAdmins?: boolean
  serverUrl?: string
  uploadedRecordsInfo?: UploadedRecordInfo[]
}
