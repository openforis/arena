import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  chainUuid: 'chain_uuid',
  index: 'index',
  props: Table.columnSetCommon.props,
}

const tableName = 'chain_node_def'
/**
 * @typedef {module:arena.TableSurvey} module:arena.TableStep
 */
export default class TableStep extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, tableName, columnSet)
    this.getSelect = getSelect.bind(this)
  }

  get columnChainUuid() {
    return this.getColumn(columnSet.chainUuid)
  }

  get columnIndex() {
    return this.getColumn(columnSet.index)
  }
}

TableStep.columnSet = columnSet
TableStep.tableName = tableName
