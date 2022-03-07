import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

const columnsByNodeDefType = {
  [NodeDef.nodeDefType.code]: ({ parentDef, nodeDef, includeCategoryItemsLabels }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, valueProp: Node.valuePropsCode.code, parentDef },
      ...(includeCategoryItemsLabels
        ? [{ header: `${nodeDefName}_label`, nodeDef, valueProp: Node.valuePropsCode.label, parentDef }]
        : []),
    ]
  },
  [NodeDef.nodeDefType.taxon]: ({ parentDef, nodeDef, includeTaxonScientificName }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: nodeDefName, nodeDef, valueProp: Node.valuePropsTaxon.code, parentDef },
      ...(includeTaxonScientificName
        ? [{ header: `${nodeDefName}_scientific_name`, nodeDef, valueProp: Node.valuePropsTaxon, parentDef }]
        : []),
    ]
  },
  [NodeDef.nodeDefType.file]: ({ parentDef, nodeDef }) => {
    const nodeDefName = NodeDef.getName(nodeDef)
    return [
      { header: `${nodeDefName}_file_uuid`, nodeDef, valueProp: Node.valuePropsFile.fileUuid, parentDef },
      { header: `${nodeDefName}_file_name`, nodeDef, valueProp: Node.valuePropsFile.fileName, parentDef },
    ]
  },
}

const getMainColumn = ({ parentDef, nodeDef }) => ({ header: NodeDef.getName(nodeDef), nodeDef, parentDef })

const DEFAULT_OPTIONS = { includeCategoryItemsLabels: true, includeTaxonScientificName: true, includeFiles: true }

const RECORD_CYCLE_HEADER = 'record_cycle'

export class CsvExportModel {
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

  _createColumnsFromAttributeDefs({ attributeDefs, parentDef }) {
    const { includeCategoryItemsLabels, includeTaxonScientificName } = this.options

    return attributeDefs.reduce((acc, nodeDef) => {
      const columnsGetter = columnsByNodeDefType[NodeDef.getType(nodeDef)]
      const columnsPerAttribute = columnsGetter
        ? columnsGetter({ parentDef, nodeDef, includeCategoryItemsLabels, includeTaxonScientificName })
        : [getMainColumn({ parentDef, nodeDef })]
      return [...acc, ...columnsPerAttribute]
    }, [])
  }

  _extractAncestorsKeysColumns() {
    let ancestorsKeyColumns = []

    Survey.visitAncestors(this.nodeDefContext, (nodeDefAncestor) => {
      const ancestorKeyDefs = Survey.getNodeDefKeys(nodeDefAncestor)(this.survey)
      const ancestorKeyColumns = this._createColumnsFromAttributeDefs({
        attributeDefs: ancestorKeyDefs,
        parentDef: nodeDefAncestor,
      })
      ancestorsKeyColumns = [...ancestorKeyColumns, ...ancestorsKeyColumns]
    })(this.survey)

    return ancestorsKeyColumns
  }

  _extractAttributeDefsColumns() {
    const { includeFiles } = this.options

    let descendantDefs = NodeDef.isEntity(this.nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(this.nodeDefContext)(this.survey)
      : [this.nodeDefContext] // Multiple attribute

    if (!includeFiles) {
      descendantDefs = descendantDefs.filter((nodeDef) => !NodeDef.isFile(nodeDef))
    }
    const descendantAttributeColumns = this._createColumnsFromAttributeDefs({
      attributeDefs: descendantDefs,
      parentDef: this.nodeDefContext,
    })
    return descendantAttributeColumns
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header) {
    return this.columns.find((column) => column.header === header)
  }
}
