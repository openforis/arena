import * as Survey from '../../../../../core/survey/survey'
import * as ProcessingStep from '../../../../analysis/processingStep'
import * as ProcessingStepCalculation from '../../../../analysis/processingStepCalculation'

import Table from '../../tables/table'
import TableSurveyRdbResult from '../../tables/tableSurveyRdbResult'
import { ColumnNodeDef } from '../../tables/dataNodeDef'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  chainUuid: 'processing_chain_uuid',
  //stepUuid: 'processing_step_uuid',
  recordUuid: 'record_uuid',
  parentUuid: 'parent_uuid',
  nodeDefUuid: 'node_def_uuid',
  value: 'value',
}

/**
 * @typedef {module:arena.TableSurveyRdbResult} module:arena.ViewResultStep
 */
export default class ViewResultStep extends TableSurveyRdbResult {
  constructor(survey, step) {
    super(Survey.getId(survey), `step_${ProcessingStep.getUuid(step)}`, columnSet)
    this._survey = survey
    this._step = step
  }

  get survey() {
    return this._survey
  }

  get step() {
    return this._step
  }

  get columnChainUuid() {
    return this.getColumn(columnSet.chainUuid)
  }

  get columnStepUuid() {
    return this.getColumn(columnSet.stepUuid)
  }

  get columnRecordUuid() {
    return this.getColumn(columnSet.recordUuid)
  }

  get columnParentUuid() {
    return this.getColumn(columnSet.parentUuid)
  }

  get columnNodeDefUuid() {
    return this.getColumn(columnSet.nodeDefUuid)
  }

  get columnNodeDefs() {
    return ProcessingStep.getCalculations(this._step).map((calculation) => {
      const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(this.survey)
      return new ColumnNodeDef(this, nodeDef)
    })
  }
}

ViewResultStep.columnSet = columnSet
