import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const columnDataType = {
  boolean: 'boolean',
  numeric: 'numeric',
  text: 'text',
}

const getMainColumn = ({ nodeDef, dataType }) => ({ header: NodeDef.getName(nodeDef), nodeDef, dataType })

const columnsByNodeDefType = {
  [NodeDef.nodeDefType.boolean]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.boolean })],
  [NodeDef.nodeDefType.code]: ({ nodeDef, includeCategoryItemsLabels }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, dataType: columnDataType.text, valueProp: Node.valuePropsCode.code },
      ...(includeCategoryItemsLabels
        ? [
            {
              header: `${nodeDefName}_label`,
              nodeDef,
              dataType: columnDataType.text,
              valueProp: Node.valuePropsCode.label,
            },
          ]
        : []),
    ]
  },
  [NodeDef.nodeDefType.coordinate]: ({ nodeDef }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      {
        header: `${nodeDefName}_srs`,
        nodeDef,
        dataType: columnDataType.text,
        valueProp: Node.valuePropsCoordinate.srs,
      },
      { header: `${nodeDefName}_x`, nodeDef, dataType: columnDataType.numeric, valueProp: Node.valuePropsCoordinate.x },
      { header: `${nodeDefName}_y`, nodeDef, dataType: columnDataType.numeric, valueProp: Node.valuePropsCoordinate.y },
    ]
  },
  [NodeDef.nodeDefType.date]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.text })],
  [NodeDef.nodeDefType.decimal]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.numeric })],
  [NodeDef.nodeDefType.file]: ({ nodeDef }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      {
        header: `${nodeDefName}_file_uuid`,
        nodeDef,
        dataType: columnDataType.text,
        valueProp: Node.valuePropsFile.fileUuid,
      },
      {
        header: `${nodeDefName}_file_name`,
        nodeDef,
        dataType: columnDataType.text,
        valueProp: Node.valuePropsFile.fileName,
      },
    ]
  },
  [NodeDef.nodeDefType.integer]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.numeric })],
  [NodeDef.nodeDefType.taxon]: ({ nodeDef, includeTaxonScientificName }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, dataType: columnDataType.text, valueProp: Node.valuePropsTaxon.code },
      ...(includeTaxonScientificName
        ? [
            {
              header: `${nodeDefName}_scientific_name`,
              nodeDef,
              dataType: columnDataType.text,
              valueProp: Node.valuePropsTaxon,
            },
          ]
        : []),
    ]
  },
  [NodeDef.nodeDefType.text]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.text })],
  [NodeDef.nodeDefType.time]: ({ nodeDef }) => [getMainColumn({ nodeDef, dataType: columnDataType.text })],
}

const DEFAULT_OPTIONS = {
  includeAnalysis: true,
  includeAncestorAttributes: false,
  includeCategoryItemsLabels: true,
  includeReadOnlyAttributes: true,
  includeTaxonScientificName: true,
  includeFiles: true,
}

const RECORD_CYCLE_HEADER = 'record_cycle'

export class CsvDataExportModel {
  constructor({ survey, nodeDefContext, options = DEFAULT_OPTIONS }) {
    this.survey = survey
    this.nodeDefContext = nodeDefContext
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.columns = []

    this.init()
  }

  init() {
    this._initColumns()
  }

  _initColumns() {
    const { addCycle } = this.options

    const ancestorsColumns = this._extractAncestorsColumns()

    const attributeDefsColumns = this._extractAttributeDefsColumns(this.nodeDefContext)

    this.columns = [
      ...(addCycle ? [{ header: RECORD_CYCLE_HEADER }] : []),
      ...ancestorsColumns,
      ...attributeDefsColumns,
    ]
  }

  _createColumnsFromAttributeDefs(attributeDefs) {
    const { includeCategoryItemsLabels, includeTaxonScientificName } = this.options

    return attributeDefs.reduce((acc, nodeDef) => {
      const columnsGetter = columnsByNodeDefType[NodeDef.getType(nodeDef)]

      const columnsPerAttribute = columnsGetter
        ? columnsGetter({ nodeDef, includeCategoryItemsLabels, includeTaxonScientificName })
        : []

      if (NodeDef.isKey(nodeDef)) {
        columnsPerAttribute.forEach((col) => {
          col.key = true
        })
      }
      acc.push(...columnsPerAttribute)
      return acc
    }, [])
  }

  _extractAncestorsColumns() {
    const { includeAncestorAttributes } = this.options

    const ancestorsColumns = []

    Survey.visitAncestors(
      this.nodeDefContext,
      (nodeDefAncestor) => {
        const ancestorColumns = includeAncestorAttributes
          ? // include all ancestors attributes
            this._extractAttributeDefsColumns(nodeDefAncestor)
          : // include only ancestors key attributes
            this._createColumnsFromAttributeDefs(Survey.getNodeDefKeys(nodeDefAncestor)(this.survey))
        ancestorsColumns.unshift(...ancestorColumns)
      },
      false
    )(this.survey)

    return ancestorsColumns
  }

  _extractAttributeDefsColumns(nodeDefContext) {
    const { includeAnalysis, includeFiles, includeReadOnlyAttributes } = this.options

    let descendantDefs = NodeDef.isEntity(nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(nodeDefContext, includeAnalysis)(this.survey)
      : [nodeDefContext] // Multiple attribute

    descendantDefs = descendantDefs.filter(
      (nodeDef) =>
        (includeFiles || !NodeDef.isFile(nodeDef)) && (includeReadOnlyAttributes || !NodeDef.isReadOnly(nodeDef))
    )

    return this._createColumnsFromAttributeDefs(descendantDefs)
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header) {
    return this.columns.find((column) => column.header === header)
  }
}

CsvDataExportModel.columnDataType = columnDataType
