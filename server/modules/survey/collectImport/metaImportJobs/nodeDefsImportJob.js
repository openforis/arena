const R = require('ramda')

const { uuidv4 } = require('../../../../../common/uuid')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefLayout = require('../../../../../common/survey/nodeDefLayout')
const { nodeDefType } = NodeDef
const Category = require('../../../../../common/survey/category')
const Taxonomy = require('../../../../../common/survey/taxonomy')

const Job = require('../../../../job/job')

const NodeDefManager = require('../../../nodeDef/persistence/nodeDefManager')
const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

class NodeDefsImportJob extends Job {

  constructor (params) {
    super('SchemaImportJob', params)

    this.nodeDefNames = []
    this.nodeDefUuidByCollectPath = {}
  }

  async execute (tx) {
    const { collectSurvey, surveyId } = this.context

    // insert root entity and descendants recursively
    await this.insertNodeDef(surveyId, null, '', collectSurvey.schema.entity, NodeDef.nodeDefType.entity, tx)

    this.setContext({
      nodeDefUuidByCollectPath: this.nodeDefUuidByCollectPath
    })
  }

  /**
   * Inserts a node and
   */
  async insertNodeDef (surveyId, parentNodeDef, parentPath, collectNodeDef, type, tx) {
    const { defaultLanguage } = this.context

    const multiple = collectNodeDef._attr.multiple === 'true'

    const collectNodeDefName = collectNodeDef._attr.name

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, collectNodeDefName),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && collectNodeDef._attr.key === 'true',
      [NodeDef.propKeys.labels]: CollectIdmlParseUtils.toLabels(collectNodeDef.label, defaultLanguage, 'instance'),
      ...type === NodeDef.nodeDefType.entity
        ? {
          [NodeDefLayout.nodeDefLayoutProps.render]:
            collectNodeDef._attr['n1:layout'] === 'table'
              ? NodeDefLayout.nodeDefRenderType.table
              : NodeDefLayout.nodeDefRenderType.form
        }
        : {
          [NodeDef.propKeys.readOnly]: collectNodeDef._attr.calculated
        }
      ,
      ...this.extractNodeDefExtraProps(parentNodeDef, type, collectNodeDef)
    }

    // page
    const pageUuid = determineNodeDefPageUuid(type, collectNodeDef)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    const nodeDef = await NodeDefManager.createNodeDef(this.user, surveyId, NodeDef.getUuid(parentNodeDef), uuidv4(), type, props, tx)

    const collectNodeDefPath = parentPath + '/' + collectNodeDefName

    this.nodeDefUuidByCollectPath[collectNodeDefPath] = NodeDef.getUuid(nodeDef)

    if (type === nodeDefType.entity) {
      // insert child definitions

      for (const collectChildType of R.keys(collectNodeDef)) {
        const childType = CollectIdmlParseUtils.nodeDefTypesByCollectType[collectChildType]

        if (childType) {
          const collectChildDefs = CollectIdmlParseUtils.toList(collectNodeDef[collectChildType])

          for (const collectChildDef of collectChildDefs) {
            await this.insertNodeDef(surveyId, nodeDef, collectNodeDefPath, collectChildDef, childType, tx)
          }
        }
      }
    }
  }

  extractNodeDefExtraProps (parentNodeDef, type, collectNodeDef) {
    switch (type) {
      case nodeDefType.code:
        const listName = collectNodeDef._attr.list
        const category = R.find(c => listName === Category.getName(c), this.getContextProp('categories', []))

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
        }
      case nodeDefType.taxon:
        const taxonomyName = collectNodeDef._attr.taxonomy
        const taxonomy = R.find(t => taxonomyName === Taxonomy.getTaxonomyName(t), this.getContextProp('taxonomies', []))

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy)
        }
      default:
        return {}
    }
  }

  getUniqueNodeDefName (parentNodeDef, collectNodeDefName) {
    let finalName = collectNodeDefName

    if (R.includes(finalName, this.nodeDefNames)) {
      // name is in use

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getNodeDefName(parentNodeDef)}_${finalName}`
      }
      if (R.includes(finalName, this.nodeDefNames)) {
        // try to make it unique by adding _# suffix
        const prefix = finalName + '_'
        let count = 1
        finalName = prefix + count
        while (R.includes(finalName, this.nodeDefNames)) {
          finalName = prefix + (++count)
        }
      }
    }
    this.nodeDefNames.push(finalName)

    return finalName
  }

}

const determineNodeDefPageUuid = (type, collectNodeDef) => {
  const multiple = collectNodeDef._attr.multiple === 'true'

  const hasTab = R.has('n1:tab', collectNodeDef._attr)

  if (type === NodeDef.nodeDefType.entity) {
    if (multiple) {
      if (hasTab) {
        // multiple entity own tab => own page
        return uuidv4()
      } else {
        // multiple entity w/o tab => parent page
        return null
      }
    } else {
      // single entity => own page
      return uuidv4()
    }
  } else {
    // attribute => parent page
    return null
  }
}

module.exports = NodeDefsImportJob