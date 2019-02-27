const R = require('ramda')

const { uuidv4 } = require('../../../../common/uuid')
const NodeDef = require('../../../../common/survey/nodeDef')
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
  async insertNodeDef (surveyId, parentUuid, nodeSource, type, tx) {
    const props = {
      ...this.extractNodeDefProps(type, nodeSource),
      [NodeDef.propKeys.name]: nodeSource._attributes.name,
    }
    const nodeDef = await NodeDefManager.createNodeDef(this.user, surveyId, parentUuid, uuidv4(), type, props, tx)

    if (type === nodeDefType.entity) {
      for (const childCollectType of R.keys(nodeSource)) {
        const childType = nodeDefTypesByCollectType[childCollectType]

        if (childType) {
          const childSources = R.ifElse(
            R.is(Array),
            R.identity,
            (item) => [item]
          )(nodeSource[childCollectType])

          for (const childSource of childSources) {
            await this.insertNodeDef(surveyId, NodeDef.getUuid(nodeDef), childSource, childType, tx)
          }
        }
      }
    }
  }

  extractNodeDefProps (type, nodeSource) {
    switch (type) {
      case nodeDefType.code:
        const listName = nodeSource._attributes.list
        const category = R.find(category => listName === Category.getName(category), this.context.categories)

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category)
        }
      default:
        return {}
    }
  }

}

module.exports = SchemaImportJob