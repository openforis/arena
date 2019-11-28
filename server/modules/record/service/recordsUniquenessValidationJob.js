import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import Job from '@server/job/job'
import * as SurveyManager from '../../survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'
import * as SurveyRdbManager from '../../surveyRdb/manager/surveyRdbManager'

const recordValidationUpdateBatchSize = 1000

export default class RecordsUniquenessValidationJob extends Job {
  constructor(params) {
    super(RecordsUniquenessValidationJob.type, params)

    // Cache of record validations
    this.validationByRecordUuid = {}
  }

  async execute() {
    const survey = await SurveyManager.fetchSurveyById(
      this.surveyId,
      false,
      false,
      this.tx,
    )
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)

    this.total = R.length(cycleKeys) * 2

    for (const cycle of cycleKeys) {
      await this.validateRecordsUniquenessByCycle(cycle)
    }
  }

  async validateRecordsUniquenessByCycle(cycle) {
    // 1. fetch survey and node defs
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      this.surveyId,
      cycle,
      true,
      true,
      false,
      false,
      this.tx,
    )
    this.incrementProcessedItems()

    const nodeDefRoot = Survey.getNodeDefRoot(survey)
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
    if (R.isEmpty(nodeDefKeys)) {
      return
    }

    // 2. find duplicate records
    const rowsRecordsDuplicate = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(
      survey,
      cycle,
      nodeDefRoot,
      nodeDefKeys,
      this.tx,
    )

    if (!R.isEmpty(rowsRecordsDuplicate)) {
      // 3. update records validation
      const validationDuplicate = RecordValidation.newValidationRecordDuplicate()

      for (const rowRecordDuplicate of rowsRecordsDuplicate) {
        if (this.isCanceled()) {
          return
        }

        // 2. for each duplicate node entity, update record validation
        const {
          uuid: recordUuid,
          validation,
          node_duplicate_uuids: nodeDuplicateUuids,
        } = rowRecordDuplicate
        const nodeRootUuid = nodeDuplicateUuids[0]
        const nodesKeyDuplicate = await RecordManager.fetchChildNodesByNodeDefUuids(
          this.surveyId,
          recordUuid,
          nodeRootUuid,
          nodeDefKeys.map(NodeDef.getUuid),
          this.tx,
        )
        const validationRecord =
          this.validationByRecordUuid[recordUuid] || validation

        const validationUpdated = nodesKeyDuplicate.reduce(
          (validationRecord, nodeKeyDuplicate) =>
            _updateNodeValidation(
              validationRecord,
              Node.getUuid(nodeKeyDuplicate),
              validationDuplicate,
            ),
          validationRecord,
        )

        // 3. add record validation to batch update
        await this.addRecordValidationToBatchUpdate(
          recordUuid,
          validationUpdated,
        )
      }
    }

    this.incrementProcessedItems()
  }

  async addRecordValidationToBatchUpdate(recordUuid, validation) {
    this.validationByRecordUuid[recordUuid] = validation

    if (
      Object.keys(this.validationByRecordUuid).length ===
      recordValidationUpdateBatchSize
    ) {
      await this.flushRecordValidationBatchUpdate()
    }
  }

  async flushRecordValidationBatchUpdate() {
    if (Object.keys(this.validationByRecordUuid).length > 0) {
      const recordAndValidationValues = Object.entries(
        this.validationByRecordUuid,
      )
      await RecordManager.updateRecordValidationsFromValues(
        this.surveyId,
        recordAndValidationValues,
        this.tx,
      )
      this.validationByRecordUuid = {}
    }
  }

  async beforeEnd() {
    await super.beforeEnd()

    await this.flushRecordValidationBatchUpdate()
  }
}

RecordsUniquenessValidationJob.type = 'RecordsUniquenessValidationJob'

const _updateNodeValidation = (validationRecord, nodeUuid, validationNode) => {
  const nodeValidation = Validation.getFieldValidation(nodeUuid)(
    validationRecord,
  )

  // Merge new validation with node validation
  const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, validationNode)

  // Replace node validation in record validation
  return R.pipe(
    Validation.setValid(false),
    Validation.setField(nodeUuid, nodeValidationUpdated),
  )(validationRecord)
}
