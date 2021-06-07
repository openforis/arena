import Table from '../table'
import TableSurvey from '../tableSurvey'
import { getSelect } from './select'

const columnSet = {
  uuid: Table.columnSetCommon.uuid,
  chainUuid: 'chain_uuid',
  index: 'index',
  props: Table.columnSetCommon.props,
  nodeDefUuid: 'node_def_uuid',
  script: 'script',
}

const tableName = 'chain_node_def'

/**
 * @typedef {module:arena.TableSurvey} module:arena.TableChainNodeDef
 */
export default class TableChainNodeDef extends TableSurvey {
  constructor(surveyId) {
    super(surveyId, tableName, columnSet)
    this._columnsNoScript = this.columns.filter((column) => column !== this.getColumn(columnSet.script))
    this.getSelect = getSelect.bind(this)
  }

  get columnsNoScript() {
    return this._columnsNoScript
  }

  get columnChainUuid() {
    return this.getColumn(columnSet.chainUuid)
  }

  get columnIndex() {
    return this.getColumn(columnSet.index)
  }

  get columnScript() {
    return this.getColumn(columnSet.script)
  }

  get columnNodeDefUuid() {
    return super.getColumn(columnSet.nodeDefUuid)
  }
}

TableChainNodeDef.columnSet = columnSet
TableChainNodeDef.tableName = tableName
