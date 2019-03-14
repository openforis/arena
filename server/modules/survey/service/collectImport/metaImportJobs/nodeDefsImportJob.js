const R = require('ramda')

const { uuidv4 } = require('../../../../../../common/uuid')
const NodeDef = require('../../../../../../common/survey/nodeDef')
const NodeDefValidations = require('../../../../../../common/survey/nodeDefValidations')
const NodeDefExpression = require('../../../../../../common/survey/nodeDefExpression')
const NodeDefLayout = require('../../../../../../common/survey/nodeDefLayout')
const SurveyUtils = require('../../../../../../common/survey/surveyUtils')
const { nodeDefType } = NodeDef
const Category = require('../../../../../../common/survey/category')
const Taxonomy = require('../../../../../../common/survey/taxonomy')

const Job = require('../../../../../job/job')

const NodeDefManager = require('../../../../nodeDef/persistence/nodeDefManager')
const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

class NodeDefsImportJob extends Job {

  constructor (params) {
    super('NodeDefsImportJob', params)

    this.nodeDefNames = []
    this.nodeDefUuidByCollectPath = {}
  }

  async execute (tx) {
    const { collectSurvey, surveyId } = this.context

    // insert root entity and descendants recursively
    const collectRootDef = R.pipe(
      CollectIdmlParseUtils.getElementsByPath(['schema', 'entity']),
      R.head
    )(collectSurvey)

    await this.insertNodeDef(surveyId, null, '', collectRootDef, NodeDef.nodeDefType.entity, tx)

    this.setContext({
      nodeDefUuidByCollectPath: this.nodeDefUuidByCollectPath
    })
  }

  /**
   * Inserts a node and
   */
  async insertNodeDef (surveyId, parentNodeDef, parentPath, collectNodeDef, type, tx) {
    const { defaultLanguage } = this.context

    // 1. determine props
    const collectNodeDefName = collectNodeDef.attributes.name
    const multiple = collectNodeDef.attributes.multiple === 'true'

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, collectNodeDefName),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && collectNodeDef.attributes.key === 'true',
      [NodeDef.propKeys.labels]: CollectIdmlParseUtils.toLabels('label', defaultLanguage, 'instance')(collectNodeDef),
      ...type === NodeDef.nodeDefType.entity
        ? {
          [NodeDefLayout.nodeDefLayoutProps.render]:
            collectNodeDef.attributes['n1:layout'] === 'table'
              ? NodeDefLayout.nodeDefRenderType.table
              : NodeDefLayout.nodeDefRenderType.form
        }
        : {
          [NodeDef.propKeys.readOnly]: collectNodeDef.attributes.calculated
        }
      ,
      ...this.extractNodeDefExtraProps(parentNodeDef, type, collectNodeDef)
    }

    // 1a. validations
    props[NodeDef.propKeys.validations] = {
      ...multiple
        ? {
          [NodeDefValidations.keys.count]: {
            [NodeDefValidations.keys.min]: collectNodeDef.attributes.minCount,
            [NodeDefValidations.keys.max]: collectNodeDef.attributes.maxCount
          }
        }
        : {
          [NodeDefValidations.keys.required]: collectNodeDef.attributes.required,
        }
    }

    // 1b. default values
    const collectDefaultValues = CollectIdmlParseUtils.getElementsByName('default')(collectNodeDef)

    const defaultValues = R.pipe(
      R.filter(R.hasPath(['attributes', 'value'])),
      R.map(collectDefaultValue => ({
          [SurveyUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: R.path(['attributes', 'value'])(collectDefaultValue)
        })
      )
    )(collectDefaultValues)

    if (!R.isEmpty(defaultValues)) {
      props[NodeDef.propKeys.defaultValues] = defaultValues
    }

    // 2. determine page
    const pageUuid = determineNodeDefPageUuid(type, collectNodeDef)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    // 3. insert node def into db
    const nodeDef = await NodeDefManager.createNodeDef(this.getUser(), surveyId, NodeDef.getUuid(parentNodeDef), uuidv4(), type, props, tx)

    const collectNodeDefPath = parentPath + '/' + collectNodeDefName

    this.nodeDefUuidByCollectPath[collectNodeDefPath] = NodeDef.getUuid(nodeDef)

    if (type === nodeDefType.entity) {
      // insert child definitions

      for (const collectChild of collectNodeDef.elements) {
        const collectChildType = collectChild.name

        const childType = CollectIdmlParseUtils.nodeDefTypesByCollectType[collectChildType]

        if (childType) {
          await this.insertNodeDef(surveyId, nodeDef, collectNodeDefPath, collectChild, childType, tx)
        }
      }
    }
  }

  extractNodeDefExtraProps (parentNodeDef, type, collectNodeDef) {
    switch (type) {
      case nodeDefType.code:
        const listName = collectNodeDef.attributes.list
        const category = R.find(c => listName === Category.getName(c), this.getContextProp('categories', []))

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
          [NodeDefLayout.nodeDefLayoutProps.render]: NodeDefLayout.nodeDefRenderType.dropdown
        }
      case nodeDefType.taxon:
        const taxonomyName = collectNodeDef.attributes.taxonomy
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
  const multiple = collectNodeDef.attributes.multiple === 'true'

  const hasTab = R.has('n1:tab', collectNodeDef.attributes)

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