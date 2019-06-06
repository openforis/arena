const util = require('util')
const R = require('ramda')

const { uuidv4 } = require('../../../../../../common/uuid')
const StringUtils = require('../../../../../../common/stringUtils')

const Survey = require('../../../../../../common/survey/survey')
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

const SurveyManager = require('../../../../survey/manager/surveyManager')
const NodeDefManager = require('../../../../nodeDef/manager/nodeDefManager')
const CollectImportReportManager = require('../../../manager/collectImportReportManager')
const CollectSurvey = require('../model/collectSurvey')

const qualifiableItemApplicableExpressionFormat = `this.node('%s').getValue().props.code === '%s'`
const specifyAttributeSuffix = 'specify'

const checkExpressionParserByType = {
  'compare': collectCheck => {
    const attributeToOperator = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<='
    }
    const exprParts = []

    const attributes = CollectSurvey.getAttributes(collectCheck)
    for (const attr of R.keys(attributes)) {
      const operator = attributeToOperator[attr]
      if (operator)
        exprParts.push(`$this ${operator} ${attributes[attr]}`)
    }
    return R.join(' and ', exprParts)
  },
  'check': collectCheck => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
  'distance': collectCheck => {
    const { max, to } = CollectSurvey.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  'pattern': collectCheck => {
    const { regex } = CollectSurvey.getAttributes(collectCheck)
    return `$this must respect the pattern: ${regex}`
  },
  'unique': collectCheck => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  }
}

class NodeDefsImportJob extends Job {

  constructor (params) {
    super(NodeDefsImportJob.type, params)

    this.nodeDefs = {} //node definitions by uuid
    this.nodeDefNames = [] //node def names used (to avoid naming collision)
    this.nodeDefsInfoByCollectPath = {} //used by following jobs
    this.issuesCount = 0
  }

  async execute (tx) {
    const { collectSurvey, surveyId, user } = this.context

    // insert root entity and descendants recursively
    const collectRootDef = R.pipe(
      CollectSurvey.getElementsByPath(['schema', 'entity']),
      R.head
    )(collectSurvey)

    await this.insertNodeDef(surveyId, null, '', collectRootDef, NodeDef.nodeDefType.entity, tx)

    const collectReport = {
      [Survey.collectReportKeys.issuesTotal]: this.issuesCount,
      [Survey.collectReportKeys.issuesResolved]: 0
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReport, tx)

    //fetch survey and store it in context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, true, true, false, tx)

    this.setContext({
      nodeDefsInfoByCollectPath: this.nodeDefsInfoByCollectPath,
      [Job.keysContext.survey]: survey
    })
  }

  /**
   * Inserts a node definition and all its descendants (if any)
   *
   * If field is specified, creates an attribute definition with `_${field}` as suffix for name and label
   * (used to import Collect composite attribute definitions like Range)
   */
  async insertNodeDef (surveyId, parentNodeDef, parentPath, collectNodeDef, type, tx, field = null) {
    const { defaultLanguage } = this.context

    // 1. determine basic props
    const collectNodeDefName = CollectSurvey.getAttribute('name')(collectNodeDef)
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)
    const calculated = CollectSurvey.getAttributeBoolean('calculated')(collectNodeDef)
    const key = CollectSurvey.getAttributeBoolean('key')(collectNodeDef)

    const collectNodeDefPath = parentPath + '/' + collectNodeDefName

    const tableLayout = multiple &&
      CollectSurvey.getUiAttribute('layout', CollectSurvey.layoutTypes.table)(collectNodeDef) === CollectSurvey.layoutTypes.table

    const nodeDefNameSuffix = field ? `_${field}` : ''
    const nodeDefLabelSuffix = field ? ` (${field})` : ''

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, collectNodeDefName + nodeDefNameSuffix),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && key,
      [NodeDef.propKeys.labels]: CollectSurvey.toLabels('label', defaultLanguage, ['instance', 'heading'], nodeDefLabelSuffix)(collectNodeDef),
      ...type === NodeDef.nodeDefType.entity
        ? {
          [NodeDefLayout.nodeDefLayoutProps.render]:
            tableLayout
              ? NodeDefLayout.nodeDefRenderType.table
              : NodeDefLayout.nodeDefRenderType.form
        }
        : {
          [NodeDef.propKeys.readOnly]: calculated
        },
      [NodeDefLayout.nodeDefLayoutProps.layout]: tableLayout ? [] : null,
      ...this.extractNodeDefExtraProps(parentNodeDef, type, collectNodeDef)
    }

    // 2. determine page
    const pageUuid = determineNodeDefPageUuid(type, collectNodeDef)
    if (pageUuid)
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = pageUuid

    // 3. insert node def into db
    const nodeDefParam = NodeDef.newNodeDef(NodeDef.getUuid(parentNodeDef), type, props)
    let nodeDef = await NodeDefManager.insertNodeDef(this.getUser(), surveyId, nodeDefParam, tx)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    // 4. insert children and updated layout props
    const propsUpdated = {}

    if (type === nodeDefType.entity) {
      // 4a. insert child definitions

      const childrenUuids = []

      for (const collectChild of collectNodeDef.elements) {
        if (this.isCanceled())
          break

        const childDefFields = CollectSurvey.getNodeDefFieldsByCollectNodeDef(collectChild)

        if (childDefFields) {
          for (const childDefField of childDefFields) {
            const { type: childType, field = null } = childDefField
            const childDef = await this.insertNodeDef(surveyId, nodeDef, collectNodeDefPath, collectChild, childType, tx, field)
            if (tableLayout) {
              childrenUuids.push(NodeDef.getUuid(childDef))
            }
          }
        }
      }
      if (tableLayout) {
        // update layout prop
        propsUpdated[NodeDefLayout.nodeDefLayoutProps.layout] = childrenUuids
      }
    } else if (type === nodeDefType.code) {
      // 4b. add specify text attribute def
      await this.addSpecifyTextAttribute(surveyId, parentNodeDef, nodeDef, tx)
    }

    // 5. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvancedProps(parentNodeDef, nodeDefUuid, type, collectNodeDef, tx)

    nodeDef = await NodeDefManager.updateNodeDefProps(this.getUser(), surveyId, nodeDefUuid, propsUpdated, propsAdvanced, tx)

    // 6. store nodeDef in cache
    let nodeDefsInfo = this.nodeDefsInfoByCollectPath[collectNodeDefPath]
    if (!nodeDefsInfo) {
      nodeDefsInfo = []
      this.nodeDefsInfoByCollectPath[collectNodeDefPath] = nodeDefsInfo
    }
    nodeDefsInfo.push({
      uuid: nodeDefUuid,
      ...field ? { field } : {}
    })

    this.nodeDefs[nodeDefUuid] = nodeDef

    return nodeDef
  }

  async extractNodeDefAdvancedProps (parentNodeDef, nodeDefUuid, type, collectNodeDef, tx) {
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)

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
            [NodeDefValidations.keys.min]: CollectSurvey.getAttribute('minCount')(collectNodeDef),
            [NodeDefValidations.keys.max]: CollectSurvey.getAttribute('maxCount')(collectNodeDef),
          }
        }
        : {
          [NodeDefValidations.keys.required]: CollectSurvey.getAttribute('required')(collectNodeDef),
        }
    }

    if (type !== nodeDefType.entity) {
      await this.parseNodeDefValidationRules(nodeDefUuid, collectNodeDef, tx)
    }

    if (type === nodeDefType.code) {
      const parentExpr = CollectSurvey.getAttribute('parent')(collectNodeDef)
      if (parentExpr)
        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.codeParent, parentExpr, null, null, tx)
    }

    // 3. applicable (not supported)
    const relevantExpr = CollectSurvey.getAttribute('relevant')(collectNodeDef)
    if (relevantExpr) {
      await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.applicable, relevantExpr, null, null, tx)
    }

    return propsAdvanced
  }

  extractNodeDefExtraProps (parentNodeDef, type, collectNodeDef) {
    switch (type) {
      case nodeDefType.code:
        const listName = CollectSurvey.getAttribute('list')(collectNodeDef)
        const category = R.find(c => listName === Category.getName(c), this.getContextProp('categories', []))

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
          [NodeDefLayout.nodeDefLayoutProps.render]: NodeDefLayout.nodeDefRenderType.dropdown
        }
      case nodeDefType.taxon:
        const taxonomyName = CollectSurvey.getAttribute('taxonomy')(collectNodeDef)
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

    const collectDefaultValues = CollectSurvey.getElementsByName('default')(collectNodeDef)

    const defaultValues = []

    for (const collectDefaultValue of collectDefaultValues) {
      const { value, expr, applyIf } = CollectSurvey.getAttributes(collectDefaultValue)
      if (StringUtils.isNotBlank(expr) || StringUtils.isNotBlank(applyIf)) {
        const messages = CollectSurvey.toLabels('messages', defaultLanguage)(collectDefaultValue)
        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.defaultValue, expr, applyIf, messages, tx)
      } else if (StringUtils.isNotBlank(value)) {
        defaultValues.push({
          [SurveyUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: value
        })
      } else {
        this.logDebug('empty value found in default attribute constant value')
      }
    }

    return defaultValues
  }

  async parseNodeDefValidationRules (nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const elements = CollectSurvey.getElements(collectNodeDef)
    for (const element of elements) {
      const checkExpressionParser = checkExpressionParserByType[CollectSurvey.getElementName(element)]
      if (checkExpressionParser) {
        const collectExpr = checkExpressionParser(element)
        const messages = CollectSurvey.toLabels('message', defaultLanguage)(element)
        const { condition } = CollectSurvey.getAttributes(element)

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

    this.issuesCount++
  }

  /**
   * Adds a text attribute with name ${nodeDefName}_${qualifiableCode} (for each 'qualifiable' code list item in the list)
   */
  async addSpecifyTextAttribute (surveyId, parentNodeDef, nodeDef, tx) {
    const categories = this.getContextProp('categories', {})
    const category = R.find(category => Category.getUuid(category) === NodeDef.getCategoryUuid(nodeDef), categories)
    const categoryName = Category.getName(category)
    const survey = {
      nodeDefs: this.nodeDefs
    }
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)

    const qualifiableItemCodesByCategoryAndLevel = this.getContextProp('qualifiableItemCodesByCategoryAndLevel', {})
    const qualifiableItemCodes = R.pathOr([], [categoryName, levelIndex + ''], qualifiableItemCodesByCategoryAndLevel)

    for (const itemCode of qualifiableItemCodes) {
      const nodeDefName = NodeDef.getName(nodeDef)
      const props = {
        [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, `${nodeDefName}_${itemCode}`),
        [NodeDef.propKeys.labels]: R.mapObjIndexed(label => `${label} ${specifyAttributeSuffix}`)(NodeDef.getLabels())
      }
      const qualifierNodeDefParam = NodeDef.newNodeDef(NodeDef.getUuid(parentNodeDef), nodeDefType.text, props)
      const qualifierNodeDef = await NodeDefManager.insertNodeDef(this.getUser(), surveyId, qualifierNodeDefParam, tx)
      const propsAdvanced = {
        [NodeDef.propKeys.applicable]: [NodeDefExpression.createExpression(util.format(qualifiableItemApplicableExpressionFormat, nodeDefName, itemCode))]
      }
      await NodeDefManager.updateNodeDefProps(this.getUser(), surveyId, NodeDef.getUuid(qualifierNodeDef), {}, propsAdvanced, tx)

      this.nodeDefs[NodeDef.getUuid(qualifierNodeDef)] = qualifierNodeDef
    }
  }
}

const determineNodeDefPageUuid = (type, collectNodeDef) => {
  if (type === NodeDef.nodeDefType.entity) {
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)
    if (multiple) {
      const tab = CollectSurvey.getUiAttribute('tab')(collectNodeDef)

      if (tab) {
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

NodeDefsImportJob.type = 'NodeDefsImportJob'

module.exports = NodeDefsImportJob