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
const CollectImportReportItem = require('../../../../../../common/survey/collectImportReportItem')

const Job = require('../../../../../job/job')

const NodeDefManager = require('../../../../nodeDef/persistence/nodeDefManager')
const CollectImportReportManager = require('../../../../collectImportReport/persistence/collectImportReportManager')
const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

class NodeDefsImportJob extends Job {

  constructor (params) {
    super('NodeDefsImportJob', params)

    this.nodeDefNames = []
    this.nodeDefUuidByCollectPath = {}

    this.currentNodeDefReportItem = {}
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
   * Inserts a node definition and all its descendants (if any)
   */
  async insertNodeDef (surveyId, parentNodeDef, parentPath, collectNodeDef, type, tx) {
    const { defaultLanguage } = this.context

    this.currentNodeDefReportItem = {}

    const nodeDefUuid = uuidv4()

    // 1. determine basic props
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

    // 2. determine page
    const pageUuid = determineNodeDefPageUuid(type, collectNodeDef)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    // 3. insert node def into db
    const nodeDef = await NodeDefManager.createNodeDef(this.getUser(), surveyId, NodeDef.getUuid(parentNodeDef), nodeDefUuid, type, props, tx)

    // 4. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvanecdProps(parentNodeDef, nodeDefUuid, type, collectNodeDef, tx)

    await NodeDefManager.updateNodeDefProps(this.getUser(), surveyId, nodeDefUuid, {}, propsAdvanced, tx)

    // 5. store nodeDefUuid in cache
    const collectNodeDefPath = parentPath + '/' + collectNodeDefName
    this.nodeDefUuidByCollectPath[collectNodeDefPath] = nodeDefUuid

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

  async extractNodeDefAdvanecdProps (parentNodeDef, nodeDefUuid, type, collectNodeDef, tx) {
    const multiple = collectNodeDef.attributes.multiple === 'true'

    const propsAdvanced = {}

    // 1a. validations
    propsAdvanced[NodeDef.propKeys.validations] = {
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
    const defaultValues = await this.extractNodeDefDefaultValues(nodeDefUuid, collectNodeDef, tx)

    if (!R.isEmpty(defaultValues)) {
      propsAdvanced[NodeDef.propKeys.defaultValues] = defaultValues
    }

    // applicable (not supported)
    const relevantExpr = collectNodeDef.attributes.relevant
    if (relevantExpr) {
      await this.addCurrentNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.applicable, relevantExpr, null, null, tx)
    }

    return propsAdvanced
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

  async extractNodeDefDefaultValues (nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const collectDefaultValues = CollectIdmlParseUtils.getElementsByName('default')(collectNodeDef)

    const defaultValues = []

    for (const collectDefaultValue of collectDefaultValues) {
      const { value, expression, applyIf } = collectDefaultValue.attributes
      if (expression || applyIf) {
        const messages = CollectIdmlParseUtils.toLabels('messages', defaultLanguage)(collectDefaultValue)
        await this.addCurrentNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.defaultValue, expression, applyIf, messages, tx)
      } else {
        defaultValues.push({
          [SurveyUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: value
        })
      }
    }

    return defaultValues
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

  async addCurrentNodeDefImportIssue (nodeDefUuid, expressionType, expression = null, applyIf = null, messages = {}, tx) {
    await CollectImportReportManager.insertItem(this.getSurveyId(), nodeDefUuid, {
      [CollectImportReportItem.propKeys.expressionType]: expressionType,
      [CollectImportReportItem.propKeys.expression]: expression,
      [CollectImportReportItem.propKeys.applyIf]: applyIf,
      [CollectImportReportItem.propKeys.messages]: messages
    }, tx)
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