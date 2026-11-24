import UniqueItemsBatchPersister from '@server/db/uniqueItemsBatchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 1000

export class RecordsDateModifiedBatchPersister extends UniqueItemsBatchPersister {
  surveyId: number

  constructor({ surveyId, tx }) {
    super(
      (recordUuidsAndDateModified) =>
        RecordManager.updateRecordDateModifiedFromValues(surveyId, recordUuidsAndDateModified, this.tx),
      BATCH_SIZE,
      tx
    )

    this.surveyId = surveyId
  }
}
