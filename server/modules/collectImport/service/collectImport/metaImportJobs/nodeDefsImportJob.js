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
const Validator = require('../../../../../../common/validation/validator')

const Job = require('../../../../../job/job')

const NodeDefManager = require('../../../../nodeDef/persistence/nodeDefManager')
const CollectImportReportManager = require('../../../persistence/collectImportReportManager')
const CollectIdmlParseUtils = require('./collectIdmlParseUtils')

const checkExpressionParserByType = {
  'compare': collectCheck => {
    const attributeToOperator = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<='
    }
    const exprParts = []

    const attributes = CollectIdmlParseUtils.getAttributes(collectCheck)
    for (const attr of R.keys(attributes)) {
      const operator = attributeToOperator[attr]
      if (operator)
        exprParts.push(`$this ${operator} ${attributes[attr]}`)
    }
    return R.join(' and ', exprParts)
  },
  'check': collectCheck => {
    const { expr } = CollectIdmlParseUtils.getAttributes(collectCheck)
    return expr
  },
  'distance': collectCheck => {
    const { max, to } = CollectIdmlParseUtils.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  'pattern': collectCheck => {
    const { regex } = CollectIdmlParseUtils.getAttributes(collectCheck)
    return `$this must respect the pattern: ${regex}`
  },
  'unique': collectCheck => {
    const { expr } = CollectIdmlParseUtils.getAttributes(collectCheck)
    return expr
  }
}

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
   * Inserts a node definition and all its descendants (if any)
   */
  async insertNodeDef (surveyId, parentNodeDef, parentPath, collectNodeDef, type, tx) {
    const { defaultLanguage } = this.context

    // 1. determine basic props
    const { name: collectNodeDefName, multiple, key, calculated } = CollectIdmlParseUtils.getAttributes(collectNodeDef)

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, collectNodeDefName),
      [NodeDef.propKeys.multiple]: multiple === 'true',
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && key === 'true',
      [NodeDef.propKeys.labels]: CollectIdmlParseUtils.toLabels('label', defaultLanguage, 'instance')(collectNodeDef),
      ...type === NodeDef.nodeDefType.entity
        ? {
          [NodeDefLayout.nodeDefLayoutProps.render]:
            collectNodeDef.attributes['n1:layout'] === 'table'
              ? NodeDefLayout.nodeDefRenderType.table
              : NodeDefLayout.nodeDefRenderType.form
        }
        : {
          [NodeDef.propKeys.readOnly]: calculated === 'true'
        }
      ,
      ...this.extractNodeDefExtraProps(parentNodeDef, type, collectNodeDef)
    }

    // 2. determine page
    const pageUuid = determineNodeDefPageUuid(type, collectNodeDef)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    // 3. insert node def into db
    const nodeDefParam = NodeDef.newNodeDef(NodeDef.getUuid(parentNodeDef), type, props)
    const nodeDef = await NodeDefManager.insertNodeDef(this.getUser(), surveyId, nodeDefParam, tx)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    // 4. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvancedProps(parentNodeDef, nodeDefUuid, type, collectNodeDef, tx)

    await NodeDefManager.updateNodeDefProps(this.getUser(), surveyId, nodeDefUuid, {}, propsAdvanced, tx)

    // 5. store nodeDefUuid in cache
    const collectNodeDefPath = parentPath + '/' + collectNodeDefName
    this.nodeDefUuidByCollectPath[collectNodeDefPath] = nodeDefUuid

    if (type === nodeDefType.entity) {
      // insert child definitions

      for (const collectChild of collectNodeDef.elements) {
        if (this.isCanceled())
          break

        const collectChildType = collectChild.name

        const childType = CollectIdmlParseUtils.nodeDefTypesByCollectType[collectChildType]

        if (childType) {
          await this.insertNodeDef(surveyId, nodeDef, collectNodeDefPath, collectChild, childType, tx)
        }
      }
    }
  }

  async extractNodeDefAdvancedProps (parentNodeDef, nodeDefUuid, type, collectNodeDef, tx) {
    const multiple = collectNodeDef.attributes.multiple === 'true'

    const propsAdvanced = {}

    // 1. default values
    const defaultValues = await this.parseNodeDefDefaultValues(nodeDefUuid, collectNodeDef, tx)

    if (!R.isEmpty(defaultValues)) {
      propsAdvanced[NodeDef.propKeys.defaultValues] = defaultValues
    }

    // 2. validations
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

    if (type !== nodeDefType.entity) {
      await this.parseNodeDefValidationRules(nodeDefUuid, collectNodeDef, tx)
    }

    if (type === nodeDefType.code) {
      const parentExpr = CollectIdmlParseUtils.getAttribute('parent')(collectNodeDef)
      if (parentExpr)
        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.codeParent, parentExpr, null, null, tx)
    }

    // 3. applicable (not supported)
    const relevantExpr = collectNodeDef.attributes.relevant
    if (relevantExpr) {
      await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.applicable, relevantExpr, null, null, tx)
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
        const taxonomy = R.find(t => taxonomyName === Taxonomy.getName(t), this.getContextProp('taxonomies', []))

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy)
        }
      default:
        return {}
    }
  }

  async parseNodeDefDefaultValues (nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const collectDefaultValues = CollectIdmlParseUtils.getElementsByName('default')(collectNodeDef)

    const defaultValues = []

    for (const collectDefaultValue of collectDefaultValues) {
      const { value, expression, applyIf } = collectDefaultValue.attributes
      if (expression || applyIf) {
        const messages = CollectIdmlParseUtils.toLabels('messages', defaultLanguage)(collectDefaultValue)
        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.defaultValue, expression, applyIf, messages, tx)
      } else {
        defaultValues.push({
          [SurveyUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: value
        })
      }
    }

    return defaultValues
  }

  async parseNodeDefValidationRules (nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const elements = CollectIdmlParseUtils.getElements(collectNodeDef)
    for (const element of elements) {
      const checkExpressionParser = checkExpressionParserByType[CollectIdmlParseUtils.getName(element)]
      if (checkExpressionParser) {
        const collectExpr = checkExpressionParser(element)
        const messages = CollectIdmlParseUtils.toLabels('message', defaultLanguage)(element)
        const { condition } = CollectIdmlParseUtils.getAttributes(element)

        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.check, collectExpr, condition, messages, tx)
      }
    }
  }

  getUniqueNodeDefName (parentNodeDef, collectNodeDefName) {
    let finalName = collectNodeDefName

    if (R.includes(finalName, this.nodeDefNames)
      || R.includes(finalName, Validator.keywords)) {
      // name is in use or is a keyword

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getName(parentNodeDef)}_${finalName}`
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

  async addNodeDefImportIssue (nodeDefUuid, expressionType, expression = null, applyIf = null, messages = {}, tx) {
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