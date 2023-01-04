import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const columnsByNodeDefType = {
  [NodeDef.nodeDefType.code]: ({ nodeDef, includeCategoryItemsLabels }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, valueProp: Node.valuePropsCode.code },
      ...(includeCategoryItemsLabels
        ? [{ header: `${nodeDefName}_label`, nodeDef, valueProp: Node.valuePropsCode.label }]
        : []),
    ]
  },
  [NodeDef.nodeDefType.taxon]: ({ nodeDef, includeTaxonScientificName }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, valueProp: Node.valuePropsTaxon.code },
      ...(includeTaxonScientificName
        ? [{ header: `${nodeDefName}_scientific_name`, nodeDef, valueProp: Node.valuePropsTaxon }]
        : []),
    ]
  },
  [NodeDef.nodeDefType.file]: ({ nodeDef }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: `${nodeDefName}_file_uuid`, nodeDef, valueProp: Node.valuePropsFile.fileUuid },
      { header: `${nodeDefName}_file_name`, nodeDef, valueProp: Node.valuePropsFile.fileName },
    ]
  },
}

const getMainColumn = ({ nodeDef }) => ({ header: NodeDef.getName(nodeDef), nodeDef })

const DEFAULT_OPTIONS = { includeCategoryItemsLabels: true, includeTaxonScientificName: true, includeFiles: true }

const RECORD_CYCLE_HEADER = 'record_cycle'

export class CsvDataExportModel {
  constructor({ survey, nodeDefContext, options = DEFAULT_OPTIONS }) {
    this.survey = survey
    this.nodeDefContext = nodeDefContext
    this.options = options
    this.columns = []

    this.init()
  }

  init() {
    this._initColumns()
  }

  _initColumns() {
    const { addCycle } = this.options

    const descendantAttributeColumns = this._extractAttributeDefsColumns()

    const ancestorsKeyColumns = this._extractAncestorsKeysColumns()

    this.columns = [
      ...(addCycle ? [{ header: RECORD_CYCLE_HEADER }] : []),
      ...ancestorsKeyColumns,
      ...descendantAttributeColumns,
    ]
  }

  _createColumnsFromAttributeDefs({ attributeDefs }) {
    const { includeCategoryItemsLabels, includeTaxonScientificName } = this.options

    return attributeDefs.reduce((acc, nodeDef) => {
      const columnsGetter = columnsByNodeDefType[NodeDef.getType(nodeDef)]

      const columnsPerAttribute = columnsGetter
        ? columnsGetter({ nodeDef, includeCategoryItemsLabels, includeTaxonScientificName })
        : [getMainColumn({ nodeDef })]

      if (NodeDef.isKey(nodeDef)) {
        columnsPerAttribute.forEach((col) => {
          col.key = true
        })
      }
      acc.push(...columnsPerAttribute)
      return acc
    }, [])
  }

  _extractAncestorsKeysColumns() {
    const ancestorsKeyColumns = []

    Survey.visitAncestors(
      this.nodeDefContext,
      (nodeDefAncestor) => {
        const ancestorKeyDefs = Survey.getNodeDefKeys(nodeDefAncestor)(this.survey)
        const ancestorKeyColumns = this._createColumnsFromAttributeDefs({
          attributeDefs: ancestorKeyDefs,
        })
        ancestorsKeyColumns.unshift(...ancestorKeyColumns)
      },
      false
    )(this.survey)

    return ancestorsKeyColumns
  }

  _extractAttributeDefsColumns() {
    const { includeFiles, includeAnalysis } = this.options

    let descendantDefs = NodeDef.isEntity(this.nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(this.nodeDefContext, includeAnalysis)(this.survey)
      : [this.nodeDefContext] // Multiple attribute

    if (!includeFiles) {
      descendantDefs = descendantDefs.filter((nodeDef) => !NodeDef.isFile(nodeDef))
    }
    return this._createColumnsFromAttributeDefs({ attributeDefs: descendantDefs })
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header) {
    return this.columns.find((column) => column.header === header)
  }
}
