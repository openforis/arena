import * as R from 'ramda'

import Survey from '../../../../core/survey/survey'
import NodeDef, { INodeDef } from '../../../../core/survey/nodeDef'

import Node from '../../../../core/record/node'
import RecordValidation from '../../../../core/record/recordValidation'
import Validation from '../../../../core/validation/validation'

import SurveyManager from '../../survey/manager/surveyManager'
import RecordManager from '../manager/recordManager'
import SurveyRdbManager from '../../surveyRdb/manager/surveyRdbManager'

import Job from '../../../job/job'

const recordValidationUpdateBatchSize = 1000

export default class RecordsUniquenessValidationJob extends Job {
	public validationByRecordUuid: any;
  static type: string = 'RecordsUniquenessValidationJob'

  constructor (params?) {
    super(RecordsUniquenessValidationJob.type, params)

    //cache of record validations
    this.validationByRecordUuid = {}
  }

  async execute (tx) {
    const survey = await SurveyManager.fetchSurveyById(this.surveyId, false, false, this.tx)
    const cycleKeys = R.pipe(Survey.getSurveyInfo, Survey.getCycleKeys)(survey)

    this.total = R.length(cycleKeys) * 2

    for (const cycle of cycleKeys)
      await this.validateRecordsUniquenessByCycle(cycle)
  }

  async validateRecordsUniquenessByCycle (cycle) {
    // 1. fetch survey and node defs
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, cycle, true, true, false, false, this.tx)
    this.incrementProcessedItems()

    const nodeDefRoot = Survey.getNodeDefRoot(survey)
    const nodeDefKeys = Survey.getNodeDefKeys(nodeDefRoot)(survey)
    if (R.isEmpty(nodeDefKeys)) {
      return
    }

    // 2. find duplicate records
    const rowsRecordsDuplicate = await SurveyRdbManager.fetchRecordsWithDuplicateEntities(survey, cycle, nodeDefRoot, nodeDefKeys, this.tx)

    if (!R.isEmpty(rowsRecordsDuplicate)) {
      // 3. update records validation

      // TODO: this function takes no arguments!!
      const validationDuplicate = _createValidationRecordDuplicate(nodeDefRoot)

      for (const rowRecordDuplicate of rowsRecordsDuplicate) {
        if (this.isCanceled())
          return

        //2. for each duplicate node entity, update record validation
        const { uuid: recordUuid, validation, node_duplicate_uuids } = rowRecordDuplicate
        const nodeRootUuid = node_duplicate_uuids[0]
        const nodesKeyDuplicate = await RecordManager.fetchChildNodesByNodeDefUuids(this.surveyId, recordUuid, nodeRootUuid, nodeDefKeys.map(NodeDef.getUuid), this.tx)
        const validationRecord = this.validationByRecordUuid[recordUuid] || validation

        const validationUpdated = nodesKeyDuplicate.reduce(
          (validationRecord, nodeKeyDuplicate) =>
            _updateNodeValidation(validationRecord, Node.getUuid(nodeKeyDuplicate), validationDuplicate)
          , validationRecord
        )

        //3. add record validation to batch update
        await this.addRecordValidationToBatchUpdate(recordUuid, validationUpdated)
      }
    }

    this.incrementProcessedItems()
  }

  async addRecordValidationToBatchUpdate (recordUuid, validation) {
    this.validationByRecordUuid[recordUuid] = validation

    if (Object.keys(this.validationByRecordUuid).length === recordValidationUpdateBatchSize) {
      await this.flushRecordValidationBatchUpdate()
    }
  }

  async flushRecordValidationBatchUpdate () {
    if (Object.keys(this.validationByRecordUuid).length > 0) {
      const recordAndValidationValues = Object.entries(this.validationByRecordUuid)
      await RecordManager.updateRecordValidationsFromValues(this.surveyId, recordAndValidationValues, this.tx)
      this.validationByRecordUuid = {}
    }
  }

  async beforeEnd () {
    await super.beforeEnd()

    await this.flushRecordValidationBatchUpdate()
  }

}

const _createValidationRecordDuplicate = (_: INodeDef) => Validation.newInstance(
  false,
  {
    [RecordValidation.keys.recordKeys]: Validation.newInstance(
      false,
      {},
      [{ key: Validation.messageKeys.record.keyDuplicate }]
    )
  })

const _updateNodeValidation = (validationRecord, nodeUuid, validationNode) => {
  const nodeValidation = Validation.getFieldValidation(nodeUuid)(validationRecord)

  //merge new validation with node validation
  const nodeValidationUpdated = R.mergeDeepRight(nodeValidation, validationNode)

  //replace node validation in record validation
  return R.pipe(
    Validation.setValid(false),
    Validation.setField(nodeUuid, nodeValidationUpdated),
  )(validationRecord)
}
