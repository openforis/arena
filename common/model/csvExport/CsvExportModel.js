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

export class CsvExportModel {
  constructor({ survey, nodeDefContext, options = DEFAULT_OPTIONS }) {
    this.survey = survey
    this.nodeDefContext = nodeDefContext
    this.options = options
    this.attributeDefs = [] // to be initialized
    this.columns = []

    this.init()
  }

  init() {
    this._initAttributeDefs()
    this._initColumns()
  }

  _initAttributeDefs() {
    const { includeFiles } = this.options
    let descendantDefs = NodeDef.isEntity(this.nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(this.nodeDefContext)(this.survey)
      : [this.nodeDefContext] // Multiple attribute
    if (!includeFiles) {
      descendantDefs = descendantDefs.filter((nodeDef) => !NodeDef.isFile(nodeDef))
    }

    let parentKeys = []
    Survey.visitAncestors(this.nodeDefContext, (n) => {
      const keys = Survey.getNodeDefKeys(n)(this.survey)
      parentKeys = parentKeys.concat(keys)
    })(this.survey)

    this.attributeDefs = parentKeys.reverse().concat(descendantDefs)
  }

  _initColumns() {
    const { includeCategoryItemsLabels, includeTaxonScientificName, addCycle } = this.options

    const columns = []
    this.attributeDefs.forEach((nodeDef) => {
      const columnsGetter = columnsByNodeDefType[NodeDef.getType(nodeDef)]
      const columnsPerAttribute = columnsGetter
        ? columnsGetter({ nodeDef, includeCategoryItemsLabels, includeTaxonScientificName })
        : [getMainColumn({ nodeDef })]
      columns.push(...columnsPerAttribute)
    })
    // Cycle is 0-based
    this.columns = [...(addCycle ? [{ header: RECORD_CYCLE_HEADER }] : []), ...columns]
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header) {
    return this.columns.find((column) => column.header === header)
  }
}
