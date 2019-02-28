const R = require('ramda')

const { uuidv4 } = require('../../../../common/uuid')
const NodeDef = require('../../../../common/survey/nodeDef')
const NodeDefLayout = require('../../../../common/survey/nodeDefLayout')
const { nodeDefType } = NodeDef
const Category = require('../../../../common/survey/category')

const Job = require('../../../job/job')

// const SurveyManager = require('../../surveyManager')
const NodeDefManager = require('../../../nodeDef/nodeDefManager')

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
    const { surveySource, surveyId } = this.context

    // insert root entity and descendants recursively
    await this.insertNodeDef(surveyId, null, surveySource.schema.entity, NodeDef.nodeDefType.entity, tx)

    // const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, true, false, false, tx)
    // console.log(survey)
  }

  /**
   * Inserts a node and
   */
  async insertNodeDef (surveyId, parentNodeDef, nodeSource, type, tx) {
    const multiple = nodeSource._attr.multiple === 'true'

    const props = {
      ...this.extractNodeDefExtraProps(parentNodeDef, type, nodeSource),
      [NodeDef.propKeys.name]: this.getUniqueNodeName(parentNodeDef, nodeSource._attr.name),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && nodeSource._attr.key === 'true'
    }

    if (type === NodeDef.nodeDefType.entity) {
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = uuidv4()
      props[NodeDefLayout.nodeDefLayoutProps.render] = nodeSource._attr['n1:layout'] === 'table'
        ? NodeDefLayout.nodeDefRenderType.table
        : NodeDefLayout.nodeDefRenderType.form
    }

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
        const category = R.find(category => listName === Category.getName(category), this.context.categories)

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category)
        }
      default:
        return {}
    }
  }

  getUniqueNodeName (parentNodeDef, name) {
    let finalName = name

    if (R.includes(finalName, this.nodeNames)) {
      // name is in use

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getNodeDefName(parentNodeDef)}_${name}`
      }
      if (R.includes(finalName, this.nodeNames)) {
        // try to make it unique by adding _# suffix
        const prefix = name + '_'
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

module.exports = SchemaImportJob