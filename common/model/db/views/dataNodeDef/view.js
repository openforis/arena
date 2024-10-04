import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../../../core/survey/nodeDefExpression'
import * as Expression from '../../../../../core/expressionParser/expression'

import TableDataNodeDef, { ColumnNodeDef } from '../../tables/dataNodeDef'

const columnSet = {
  dateCreated: TableDataNodeDef.columnSetCommon.dateCreated,
  dateModified: TableDataNodeDef.columnSetCommon.dateModified,
  recordUuid: TableDataNodeDef.columnSet.recordUuid,
  recordCycle: TableDataNodeDef.columnSet.recordCycle,
  recordOwnerUuid: TableDataNodeDef.columnSet.recordOwnerUuid,
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

  get columnUuidName() {
    return this.columnNodeDefUuid.name
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

  get _multipleAttributeColumns() {
    const { nodeDef, survey, tableData } = this

    return Survey.getNodeDefDescendantAttributesInSingleEntities({
      nodeDef,
      includeAnalysis: true,
      includeMultipleAttributes: true,
    })(survey)
      .filter((nodeDef) => NodeDef.isMultipleAttribute(nodeDef) && NodeDef.canMultipleAttributeBeAggregated(nodeDef))
      .map((multAttrDef) => new ColumnNodeDef(tableData, multAttrDef))
  }

  get _parentViewColumns() {
    const { nodeDef, viewDataParent } = this
    return viewDataParent
      ? viewDataParent.columnNodeDefs
          .filter(
            (parentColumnNodeDef) =>
              !NodeDef.isMultipleAttribute(parentColumnNodeDef.nodeDef) ||
              (!NodeDef.isEqual(parentColumnNodeDef.nodeDef)(nodeDef) &&
                NodeDef.canMultipleAttributeBeAggregated(parentColumnNodeDef.nodeDef))
          )
          .map((columnNodeDef) => new ColumnNodeDef(viewDataParent, columnNodeDef.nodeDef))
      : []
  }

  get columnNodeDefs() {
    const { nodeDef, tableData, viewDataParent, virtual } = this
    const columns = []
    // table entity uuid column - it doesn't exist for virtual entities
    if (!virtual && !NodeDef.isMultipleAttribute(nodeDef)) {
      columns.push(new ColumnNodeDef(tableData, nodeDef))
    }
    // attribute columns
    columns.push(...tableData.columnNodeDefs)
    // multiple attribute columns
    columns.push(...this._multipleAttributeColumns)
    // parent view columns
    if (viewDataParent) {
      columns.unshift(...this._parentViewColumns)
    }
    return columns
  }

  get columnNodeDefNames() {
    return this.columnNodeDefs.flatMap((columnNodeDef) => new ColumnNodeDef(this, columnNodeDef.nodeDef).names)
  }

  get columnNodeDefNamesFull() {
    return this.columnNodeDefs.flatMap((columnNodeDef) => new ColumnNodeDef(this, columnNodeDef.nodeDef).namesFull)
  }

  get columnParentUuidName() {
    return this.viewDataParent?.columnUuidName
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
