import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../../../core/survey/nodeDefExpression'
import * as Expression from '../../../../../core/expressionParser/expression'

import TableDataNodeDef, { ColumnNodeDef } from '../../tables/dataNodeDef'
import ViewResultStep from '../resultStep'

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
  constructor(survey, nodeDef, steps = []) {
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
      const nodeDefParent = Survey.getNodeDefParent(this.nodeDef)(this.survey)
      this._viewDataParent = new ViewDataNodeDef(this.survey, nodeDefParent)
    }

    this._viewResultSteps = steps.map((step, i) => {
      const viewResultStep = new ViewResultStep(this.survey, step)
      viewResultStep.alias = `${viewResultStep.alias}_${i}`
      return viewResultStep
    })
  }

  get columnUuid() {
    return this.getColumn(`${NodeDef.getName(this.nodeDef)}_uuid`)
  }

  get columnNodeDefUuid() {
    return new ColumnNodeDef(this, this.nodeDef)
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
    return this.columnNodeDefUuids.map((columnNodeDef) => columnNodeDef.namesFull).flat()
  }

  get columnNodeDefs() {
    const columns = []
    // table entity uuid column - it doesn't exist for virtual entities
    if (!this.virtual) {
      columns.push(new ColumnNodeDef(this.tableData, this.nodeDef))
    }
    // attribute columns
    columns.push(...this.tableData.columnNodeDefs)
    // parent view columns
    if (this.viewDataParent) {
      columns.unshift(
        ...this.viewDataParent.columnNodeDefs.map(
          (columnNodeDef) => new ColumnNodeDef(this.viewDataParent, columnNodeDef.nodeDef)
        )
      )
    }
    return columns
  }

  get columnNodeDefNamesRead() {
    return this.columnNodeDefs.map((columnNodeDef) => new ColumnNodeDef(this, columnNodeDef.nodeDef).namesFull).flat()
  }

  get tableData() {
    return this._tableData
  }

  get viewDataParent() {
    return this._viewDataParent
  }

  get viewResultSteps() {
    return this._viewResultSteps
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
