import UniqueItemsBatchPersister from '@server/db/uniqueItemsBatchPersister'
import * as RecordManager from '@server/modules/record/manager/recordManager'

const BATCH_SIZE = 1000

export class RecordsValidationBatchPersister extends UniqueItemsBatchPersister {
  constructor({ surveyId, tx }) {
    super(
      async (recordUuidsAndValidations) =>
        RecordManager.updateRecordValidationsFromValues(this.surveyId, recordUuidsAndValidations, this.tx),
      BATCH_SIZE,
      tx
    )

    this.surveyId = surveyId
  }
}
