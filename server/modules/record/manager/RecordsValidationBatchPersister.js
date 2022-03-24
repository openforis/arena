import BatchPersister from '@server/db/batchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 1000

export class RecordsValidationBatchPersister extends BatchPersister {
  constructor({ surveyId, tx }) {
    super(
      async (recordUuidsAndValidations) =>
        RecordManager.updateRecordValidationsFromValues(this.surveyId, recordUuidsAndValidations, this.tx),
      BATCH_SIZE
    )

    this.surveyId = surveyId
    this.tx = tx
  }
}
