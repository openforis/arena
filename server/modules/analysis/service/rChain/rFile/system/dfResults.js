import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import { ColumnNodeDef, TableResultNode, ViewDataNodeDef } from '@common/model/db'
import { dfVar, setVar, sqldf, rm } from '../../rFunctions'

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
    const columnNames = ProcessingChain.getColumnsNamesInEntity({ survey: this.survey, entity: this.entity })(
      this.chain
    )

    this.scripts.push(setVar(this.name, sqldf(`SELECT ${columnNames.join(', ')} FROM ${this.dfSourceName}`)))
  }

  initUuids() {
    const columnNodeDef = NodeDef.isVirtual(this.entity)
      ? Survey.getNodeDefParent(this.entity)(this.survey)
      : this.entity
    const setUuids = [
      { name: TableResultNode.columnSet.chainUuid, value: `'${this.rChain.chainUuid}'` },
      {
        name: TableResultNode.columnSet.recordUuid,
        value: dfVar(this.dfSourceName, ViewDataNodeDef.columnSet.recordUuid),
      },
      {
        name: TableResultNode.columnSet.parentUuid,
        value: dfVar(this.dfSourceName, ColumnNodeDef.getColName(columnNodeDef)),
      },
    ].map((uuidMapping) => setVar(dfVar(this.name, uuidMapping.name), uuidMapping.value))

    this.scripts.push(...setUuids)
  }

  initCodeAttributes() {
    const chainNodeDefsWithNodeDefInEntity = ProcessingChain.getChainNodeDefsInEntity({
      survey: this.survey,
      entity: this.entity,
    })(this.rChain.chain)

    chainNodeDefsWithNodeDefInEntity.forEach((chainNodeDef) => {
      const { nodeDef } = chainNodeDef

      if (NodeDef.isCode(nodeDef)) {
        const nodeVarName = NodeDef.getName(nodeDef)
        const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(this.survey)

        // copy category data frame into temp variable
        const categoryTempVar = 'category'
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
            ON r.${nodeVarName}_code = c.code  
        `
        this.scripts.push(setVar('category_values', sqldf(query)))

        this.scripts.push(setVar(`${this.name}$${nodeVarName}_label`, `category_values$computed_category_label`))
        this.scripts.push(setVar(`${this.name}$${nodeVarName}_uuid`, `category_values$computed_category_uuid`))

        // remove temp category variable
        this.scripts.push(rm(categoryTempVar))
        this.scripts.push(rm('category_values'))
      }
    })
  }
}
