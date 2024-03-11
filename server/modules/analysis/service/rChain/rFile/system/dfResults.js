import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { ColumnNodeDef, TableNode, ViewDataNodeDef } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import { dfVar, setVar, sqldf, rm } from '../../rFunctions'

const categoryTempVar = 'Category'
const categoryValuesTempVar = 'Category_values'

/**
 * Class that models a data frame step results.
 */
export default class DfResults {
  constructor(rChain, entity) {
    this._rChain = rChain
    this._entity = entity
    this._scripts = []

    this.initDf = this.initDf.bind(this)
    this.initDf()
    this.initUuids()
    this.initCodeAttributes()
  }

  get rChain() {
    return this._rChain
  }

  get chain() {
    return this._rChain.chain
  }

  get survey() {
    return this.rChain.survey
  }

  get entity() {
    return this._entity
  }

  get dfSourceName() {
    return NodeDef.getName(this.entity)
  }

  get name() {
    return `${this.dfSourceName}Results`
  }

  get scripts() {
    return this._scripts
  }

  initDf() {
    const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({
      entity: this.entity,
      chain: this.chain,
      hideAreaBasedEstimate: false,
    })(this.survey)
    const columnNames = NodeDefTable.getNodeDefsColumnNames({
      nodeDefs: analysisNodeDefsInEntity,
      includeExtendedCols: false,
    })

    const areaBasedNodeDefs = analysisNodeDefsInEntity.filter(NodeDef.isAreaBasedEstimatedOf)
    areaBasedNodeDefs.forEach((areaBasedNodeDef) => this.scripts.push(NodeDef.getScript(areaBasedNodeDef)))
    this.scripts.push(setVar(this.name, sqldf(`SELECT ${columnNames.join(', ')} FROM ${this.dfSourceName}`)))
  }

  initUuids() {
    const columnNodeDef = NodeDef.isVirtual(this.entity)
      ? Survey.getNodeDefParent(this.entity)(this.survey)
      : this.entity
    const setUuids = [
      { name: NodeDef.keysPropsAdvanced.chainUuid, value: `'${this.rChain.chainUuid}'` },
      {
        name: TableNode.columnSet.recordUuid,
        value: dfVar(this.dfSourceName, ViewDataNodeDef.columnSet.recordUuid),
      },
      {
        name: TableNode.columnSet.parentUuid,
        value: dfVar(this.dfSourceName, ColumnNodeDef.getColumnName(columnNodeDef)),
      },
    ].map((uuidMapping) => setVar(dfVar(this.name, uuidMapping.name), uuidMapping.value))

    this.scripts.push(...setUuids)
  }

  initCodeAttributes() {
    const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({
      entity: this.entity,
      chain: this.rChain.chain,
    })(this.survey)

    analysisNodeDefsInEntity.forEach((nodeDef) => {
      if (NodeDef.isCode(nodeDef)) {
        const nodeVarName = NodeDef.getName(nodeDef)
        const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(this.survey)

        // copy category data frame into temp variable
        const dfCategory = this.rChain.listCategories.getDfCategoryItems(category)
        this.scripts.push(setVar(categoryTempVar, dfCategory))

        // join with category data frame to create json code value
        const query = `
            SELECT 
                r.*,
                c.label as computed_category_label,
                c.uuid as computed_category_uuid
            FROM ${this.name} r
            LEFT OUTER JOIN ${categoryTempVar} c
            ON r.${nodeVarName} = c.code  
        `
        this.scripts.push(setVar(categoryValuesTempVar, sqldf(query)))

        this.scripts.push(setVar(`${this.name}$${nodeVarName}_code`, `${categoryValuesTempVar}$${nodeVarName}`))
        this.scripts.push(
          setVar(`${this.name}$${nodeVarName}_label`, `${categoryValuesTempVar}$computed_category_label`)
        )
        this.scripts.push(setVar(`${this.name}$${nodeVarName}_uuid`, `${categoryValuesTempVar}$computed_category_uuid`))

        // remove temp category variable
        this.scripts.push(rm(categoryTempVar))
        this.scripts.push(rm(categoryValuesTempVar))
      }
    })
  }
}
