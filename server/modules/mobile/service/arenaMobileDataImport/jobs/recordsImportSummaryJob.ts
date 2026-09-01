import SystemError from '@core/systemError'
import * as Record from '@core/record/record'

import Job from '@server/job/job'
import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import {
  getRecordFormattedKeyValuesByDefUuid,
  findExistingRecordSummary,
  determineRecordAction,
} from './recordImportMatcher'

/**
 * Reads every record contained in an Arena format zip and, for each one, determines whether it's new,
 * or matches an existing record, and what action would be taken on it (insert/overwrite/merge/skip),
 * without persisting anything. Used to generate an import preview/summary.
 */
export default class RecordsImportSummaryJob extends Job {
  static readonly type = 'RecordsImportSummaryJob'

  items: any[]

  constructor(params?: any) {
    super(RecordsImportSummaryJob.type, params)
    this.items = []
  }

  async onStart() {
    await super.onStart()
    const { tx } = this
    const context: any = this.context
    const { surveyId } = context
    const recordsSummary = await RecordManager.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        offset: 0,
        limit: null,
      } as any,
      tx
    )
    this.setContext({ existingRecordsSummary: recordsSummary.list })
  }

  async execute() {
    await super.execute()

    const context: any = this.context
    const { arenaSurveyFileZip, survey, existingRecordsSummary, conflictResolutionStrategy } = context

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total === 0) {
      throw new SystemError('dataImport.noRecordsFound')
    }

    for (const recordSummary of recordSummaries) {
      const recordUuid = Record.getUuid(recordSummary)
      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)

      const existingRecordSummary = findExistingRecordSummary({
        survey,
        record,
        existingRecordsSummary,
        conflictResolutionStrategy,
      })
      const { action } = determineRecordAction({ record, existingRecordSummary, conflictResolutionStrategy })
      const keyValues = getRecordFormattedKeyValuesByDefUuid({ survey, record })

      this.items.push({
        recordUuid,
        cycle: Record.getCycle(record),
        keyValues,
        existingRecordUuid: existingRecordSummary ? Record.getUuid(existingRecordSummary) : null,
        action,
        dateModified: Record.getDateModified(record),
        existingDateModified: existingRecordSummary ? Record.getDateModified(existingRecordSummary) : null,
      })

      this.incrementProcessedItems()
    }
  }

  generateResult() {
    return { items: this.items }
  }
}
