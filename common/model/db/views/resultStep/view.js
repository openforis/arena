import * as Survey from '../../../../../core/survey/survey'
import * as ProcessingStep from '../../../../analysis/processingStep'

import TableSurveyRdbResult from '../../tables/tableSurveyRdbResult'
import { getCreate } from './create'

const columnSet = {
  uuid: 'uuid',
  chainUuid: 'processing_chain_uuid',
  stepUuid: 'processing_step_uuid',
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
    super(Survey.getId(survey), ProcessingStep.getUuid(step), columnSet)
    this.getCreate = getCreate.bind(this)
    this._survey = survey
    this._step = step
  }

  get survey() {
    return this._survey
  }

  get step() {
    return this._step
  }

  get columnUuid() {
    return this.getColumn(columnSet.uuid)
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
}
