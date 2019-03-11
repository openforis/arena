const R = require('ramda')

const { uuidv4 } = require('../../../../../common/uuid')
const NodeDef = require('../../../../../common/survey/nodeDef')
const NodeDefLayout = require('../../../../../common/survey/nodeDefLayout')
const { nodeDefType } = NodeDef
const Survey = require('../../../../../common/survey/survey')
const Category = require('../../../../../common/survey/category')
const Taxonomy = require('../../../../../common/survey/taxonomy')

const Job = require('../../../../job/job')

const NodeDefManager = require('../../../nodeDef/persistence/nodeDefManager')
const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

const nodeDefTypesByCollectType = {
  boolean: nodeDefType.boolean,
  code: nodeDefType.code,
  coordinate: nodeDefType.coordinate,
  date: nodeDefType.date,
  entity: nodeDefType.entity,
  file: nodeDefType.file,
  number: nodeDefType.decimal,
  taxon: nodeDefType.taxon,
  text: nodeDefType.text,
  time: nodeDefType.time,
}

class SchemaImportJob extends Job {

  constructor (params) {
    super('SchemaImportJob', params)

    this.nodeNames = []
  }

  async execute (tx) {
    const { collectSurvey, surveyId } = this.context

    // insert root entity and descendants recursively
    await this.insertNodeDef(surveyId, null, collectSurvey.schema.entity, NodeDef.nodeDefType.entity, tx)
  }

  /**
   * Inserts a node and
   */
  async insertNodeDef (surveyId, parentNodeDef, nodeSource, type, tx) {
    const {defaultLanguage} = this.context

    const multiple = nodeSource._attr.multiple === 'true'

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, nodeSource),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && nodeSource._attr.key === 'true',
      [NodeDef.propKeys.labels]: CollectIdmlParseUtils.toLabels(nodeSource.label, defaultLanguage, 'instance'),
      ...this.extractNodeDefExtraProps(parentNodeDef, type, nodeSource),
    }

    if (type === NodeDef.nodeDefType.entity) {
      // layout
      props[NodeDefLayout.nodeDefLayoutProps.render] = nodeSource._attr['n1:layout'] === 'table'
        ? NodeDefLayout.nodeDefRenderType.table
        : NodeDefLayout.nodeDefRenderType.form
    } else {
      // readOnly
      props[NodeDef.propKeys.readOnly] = nodeSource._attr.calculated
    }

    // page
    const pageUuid = determineNodeDefPageUuid(type, nodeSource)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    const nodeDef = await NodeDefManager.createNodeDef(this.user, surveyId, NodeDef.getUuid(parentNodeDef), uuidv4(), type, props, tx)

    if (type === nodeDefType.entity) {
      // insert child definitions

      for (const childCollectType of R.keys(nodeSource)) {
        const childType = nodeDefTypesByCollectType[childCollectType]

        if (childType) {
          const childSources = R.ifElse(
            R.is(Array),
            R.identity,
            (item) => [item]
          )(nodeSource[childCollectType])

          for (const childSource of childSources) {
            await this.insertNodeDef(surveyId, nodeDef, childSource, childType, tx)
          }
        }
      }
    }
  }

  extractNodeDefExtraProps (parentNodeDef, type, nodeSource) {
    switch (type) {
      case nodeDefType.code:
        const listName = nodeSource._attr.list
        const category = R.find(c => listName === Category.getName(c), this.getContextProp('categories', []))

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
        }
      case nodeDefType.taxon:
        const taxonomyName = nodeSource._attr.taxonomy
        const taxonomy = R.find(t => taxonomyName === Taxonomy.getTaxonomyName(t), this.getContextProp('taxonomies', []))

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy)
        }
      default:
        return {}
    }
  }

  getUniqueNodeDefName (parentNodeDef, nodeDefSource) {
    let finalName = nodeDefSource._attr.name

    if (R.includes(finalName, this.nodeNames)) {
      // name is in use

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getNodeDefName(parentNodeDef)}_${finalName}`
      }
      if (R.includes(finalName, this.nodeNames)) {
        // try to make it unique by adding _# suffix
        const prefix = finalName + '_'
        let count = 1
        finalName = prefix + count
        while (R.includes(finalName, this.nodeNames)) {
          finalName = prefix + (++count)
        }
      }
    }
    this.nodeNames.push(finalName)

    return finalName
  }

}

const determineNodeDefPageUuid = (type, nodeSource) => {
  const multiple = nodeSource._attr.multiple === 'true'

  const hasTab = R.has('n1:tab', nodeSource._attr)

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

module.exports = SchemaImportJob