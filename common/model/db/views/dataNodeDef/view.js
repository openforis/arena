import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../../../core/survey/nodeDefExpression'
import * as Expression from '../../../../../core/expressionParser/expression'

import TableDataNodeDef, { ColumnNodeDef } from '../../tables/dataNodeDef'
import * as SQL from '../../sql'
import ViewColumnNodeDef from './viewColumnNodeDef'

const columnSet = {
  dateCreated: TableDataNodeDef.columnSetCommon.dateCreated,
  dateModified: TableDataNodeDef.columnSetCommon.dateModified,
  recordUuid: TableDataNodeDef.columnSet.recordUuid,
  recordCycle: TableDataNodeDef.columnSet.recordCycle,
  keys: '_keys',
}

/**
 * @typedef {module:arena.TableDataNodeDef} module:arena.ViewDataNodeDef
 */
export default class ViewDataNodeDef extends TableDataNodeDef {
  constructor(survey, nodeDef) {
    super(survey, nodeDef)
    this.name = `${super.name}_view`
    this._virtual = NodeDef.isVirtual(this.nodeDef)
    this._root = NodeDef.isRoot(this.nodeDef)

    if (this._virtual) {
      const nodeDefSource = Survey.getNodeDefSource(this.nodeDef)(this.survey)
      this._tableData = new ViewDataNodeDef(this.survey, nodeDefSource)
    } else {
      this._tableData = new TableDataNodeDef(this.survey, this.nodeDef)
    }

    this._viewDataParent = null
    if (!this._root && !this._virtual) {
      const ancestorMultipleEntityDef = Survey.getNodeDefAncestorMultipleEntity(this.nodeDef)(this.survey)
      this._viewDataParent = new ViewDataNodeDef(this.survey, ancestorMultipleEntityDef)
    }
  }

  get columnNodeDefUuid() {
    // node def can be the entity itself or it's source entity (if virtual)
    const { nodeDef } = this.tableData
    return new ColumnNodeDef(this, nodeDef)
  }

  get columnUuid() {
    return this.columnNodeDefUuid.nameFull
  }

  get columnIdName() {
    const { nodeDef } = this.tableData
    return `_${NodeDef.getName(nodeDef)}_${TableDataNodeDef.columnSet.id}`
  }

  get columnNodeDefUuids() {
    return [
      this.columnNodeDefUuid,
      ...(this.viewDataParent
        ? this.viewDataParent.columnNodeDefUuids.map((columnNodeDef) => new ColumnNodeDef(this, columnNodeDef.nodeDef))
        : []),
    ]
  }

  get columnUuids() {
    return this.columnNodeDefUuids.flatMap((columnNodeDef) => columnNodeDef.namesFull)
  }

  get columnNodeDefs() {
    const columns = []
    // table entity uuid column - it doesn't exist for virtual entities
    if (!this.virtual && !NodeDef.isMultipleAttribute(this.nodeDef)) {
      columns.push(new ViewColumnNodeDef(this.tableData, this.nodeDef))
    }
    // attribute columns
    columns.push(...this.tableData.columnNodeDefs)
    // parent view columns
    if (this.viewDataParent) {
      columns.unshift(
        ...this.viewDataParent.columnNodeDefs.map(
          (columnNodeDef) => new ViewColumnNodeDef(this.viewDataParent, columnNodeDef.nodeDef)
        )
      )
    }
    return columns
  }

  get columnNodeDefNames() {
    return this.columnNodeDefs.flatMap((columnNodeDef) => columnNodeDef.names)
  }

  get columnNodeDefNamesFull() {
    return SQL.addAlias(this.alias, this.columnNodeDefNames)
  }

  get tableData() {
    return this._tableData
  }

  get viewDataParent() {
    return this._viewDataParent
  }

  get root() {
    return this._root
  }

  get virtual() {
    return this._virtual
  }

  get virtualExpression() {
    const formulas = NodeDef.getFormula(this.nodeDef)
    if (this.virtual && formulas.length > 0) {
      const expression = NodeDefExpression.getExpression(formulas[0])
      const expressionString = Expression.fromString(expression)
      return Expression.toString(expressionString, Expression.modes.sql)
    }
    return null
  }
}

ViewDataNodeDef.columnSet = columnSet
