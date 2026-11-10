import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as NodeDefExpression from '../../../../../core/survey/nodeDefExpression'
import * as Expression from '../../../../../core/expressionParser/expression'

import TableDataNodeDef from '../../tables/dataNodeDef'
import ColumnNodeDef from '../../tables/dataNodeDef/columnNodeDef'

const columnSet = {
  dateCreated: TableDataNodeDef.columnSetCommon.dateCreated,
  dateModified: TableDataNodeDef.columnSetCommon.dateModified,
  recordUuid: TableDataNodeDef.columnSet.recordUuid,
  recordCycle: TableDataNodeDef.columnSet.recordCycle,
  recordOwnerUuid: TableDataNodeDef.columnSet.recordOwnerUuid,
  keys: '_keys',
  // computed only when sampling rows: whether the row is an outlier
  sampleOutlier: '_sample_outlier',
}

/**
 * Makes numeric literals SQL numbers instead of text (e.g. integer_attr > 1.5 would fail with a text literal).
 * @param {object} node - The expression node.
 * @returns {object} - The expression node with numeric literals having their number value as raw value.
 */
const _numericLiteralsAsNumbers = (node) => {
  if (Array.isArray(node)) return node.map((item) => _numericLiteralsAsNumbers(item))
  if (!node || typeof node !== 'object') return node
  if (Expression.isLiteral(node) && typeof node.value === 'number') return { ...node, raw: node.value }
  return Object.fromEntries(Object.entries(node).map(([key, value]) => [key, _numericLiteralsAsNumbers(value)]))
}

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
    // attribute columns and multiple attribute columns
    columns.push(...tableData.columnNodeDefs, ...this._multipleAttributeColumns)
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

  /**
   * Virtual entity formula converted into SQL, with literals and identifiers as query parameters.
   * @returns {{clause: string, params: object}|null} - The SQL clause and its parameters, or null if there is no formula.
   */
  get virtualExpression() {
    const formulas = NodeDef.getFormula(this.nodeDef)
    const expression = this.virtual && formulas.length > 0 ? NodeDefExpression.getExpression(formulas[0]) : null
    if (!expression) return null

    const { clause, params } = Expression.toSql(_numericLiteralsAsNumbers(Expression.fromString(expression)))
    // = and != as plain SQL comparisons (rows with empty values never match them), as in the views created so far
    return {
      clause: clause.replaceAll(' IS NOT DISTINCT FROM ', ' = ').replaceAll(' IS DISTINCT FROM ', ' != '),
      params,
    }
  }
}

ViewDataNodeDef.columnSet = columnSet
