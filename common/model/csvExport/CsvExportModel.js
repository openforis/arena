import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

export class CsvExportModel {
  constructor({ survey, nodeDefContext, options = {} }) {
    this.survey = survey
    this.nodeDefContext = nodeDefContext
    this._options = options
    this._attributeDefs = [] // to be initialized
    this.columns = []

    this.init()
  }

  init() {
    this._initAttributeDefs()
    this._initColumns()
  }

  _initAttributeDefs() {
    const childDefs = NodeDef.isEntity(this.nodeDefContext)
      ? Survey.getNodeDefDescendantAttributesInSingleEntities(this.nodeDefContext)(this.survey)
      : [this.nodeDefContext] // Multiple attribute

    let parentKeys = []
    Survey.visitAncestors(this.nodeDefContext, (n) => {
      const keys = Survey.getNodeDefKeys(n)(this.survey)
      parentKeys = parentKeys.concat(keys)
    })(this.survey)

    this._attributeDefs = parentKeys.reverse().concat(childDefs)
  }

  _initColumns() {
    const { includeCategoryItemsLabels, addCycle } = this._options

    const columns = []
    this._attributeDefs.forEach((nodeDef) => {
      let columnsPerAttribute
      if (!includeCategoryItemsLabels && NodeDef.isCode(nodeDef)) {
        // keep only code column
        columnsPerAttribute = [{ header: NodeDef.getName(nodeDef), nodeDef }]
      } else {
        columnsPerAttribute = [{ header: NodeDef.getName(nodeDef), nodeDef }] // TO DO add columns for sub fields
      }
      columns.push(...columnsPerAttribute)
    })
    // Cycle is 0-based
    this.columns = [...(addCycle ? [{ header: 'record_cycle' }] : []), ...columns]
  }

  get headers() {
    return this.columns.map((column) => column.header)
  }

  getColumnByHeader(header) {
    return this.columns.find((column) => column.header === header)
  }
}
