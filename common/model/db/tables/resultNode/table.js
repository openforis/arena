import TableSurveyRdbResult from '../tableSurveyRdbResult'

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
 * @typedef {module:arena.TableSurveyRdbResult} module:arena.TableResultNode
 */
export default class TableResultNode extends TableSurveyRdbResult {
  constructor(surveyId) {
    super(surveyId, 'node', columnSet)
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

  get columnValue() {
    return this.getColumn(columnSet.value)
  }
}

TableResultNode.columnSet = columnSet
