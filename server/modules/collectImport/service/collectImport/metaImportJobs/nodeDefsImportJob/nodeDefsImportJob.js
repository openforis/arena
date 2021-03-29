import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import * as Validator from '@core/validation/validator'

import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as CollectImportJobContext from '../../collectImportJobContext'
import * as CollectImportReportManager from '../../../../manager/collectImportReportManager'
import * as CollectSurvey from '../../model/collectSurvey'
import SamplingPointDataImportJob from '../samplingPointDataImportJob'
import { CollectExpressionConverter } from './collectExpressionConverter'

const specifyAttributeSuffix = 'specify'

const collectCheckType = {
  check: 'check',
  compare: 'compare',
  distance: 'distance',
  pattern: 'pattern',
  unique: 'unique',
}

const checkExpressionParserByType = {
  [collectCheckType.compare]: (collectCheck) => {
    const attributeToOperator = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
    }
    const attributes = CollectSurvey.getAttributes(collectCheck)
    const exprParts = Object.entries(attributes).reduce((accParts, [attrName, attribute]) => {
      const operator = attributeToOperator[attrName]
      if (operator) {
        accParts.push(`$this ${operator} ${attribute}`)
      }
      return accParts
    }, [])

    return R.join(' and ', exprParts)
  },
  [collectCheckType.check]: (collectCheck) => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
  [collectCheckType.distance]: (collectCheck) => {
    const { max, to } = CollectSurvey.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  [collectCheckType.pattern]: (collectCheck) => {
    const { regex } = CollectSurvey.getAttributes(collectCheck)
    return `$this must respect the pattern: ${regex}`
  },
  [collectCheckType.unique]: (collectCheck) => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
}

export default class NodeDefsImportJob extends Job {
  constructor(params) {
    super(NodeDefsImportJob.type, params)

    this.nodeDefs = {} // Node definitions by uuid
    this.nodeDefNames = [] // Node def names used (to avoid naming collision)
    this.nodeDefsInfoByCollectPath = {} // Used by following jobs
    this.issuesCount = 0
  }

  async execute() {
    const { collectSurvey, surveyId, user } = this.context

    this._calculateTotal()

    // Insert root entity and descendants recursively
    const collectRootDef = CollectSurvey.getNodeDefRoot(collectSurvey)

    await this.insertNodeDef(null, '', collectRootDef, NodeDef.nodeDefType.entity)

    const collectReport = {
      [Survey.collectReportKeys.issuesTotal]: this.issuesCount,
      [Survey.collectReportKeys.issuesResolved]: 0,
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReport, true, this.tx)

    // Fetch survey and store it in context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      surveyId,
      Survey.cycleOneKey,
      true,
      true,
      false,
      false,
      this.tx
    )

    this.setContext({
      nodeDefsInfoByCollectPath: this.nodeDefsInfoByCollectPath,
      [Job.keysContext.survey]: survey,
    })
  }

  /**
   * Inserts a node definition and all its descendants (if any)
   *
   * If field is specified, creates an attribute definition with `_${field}` as suffix for name and label
   * (used to import Collect composite attribute definitions like Range)
   *
   * @param {NodeDef} parentNodeDef - Parent node def definition.
   * @param {!string} parentPath - Parent node path.
   * @param {!Object} collectNodeDef - Collect node definition.
   * @param {!string} type - Node definition type.
   * @param {string} field - Node sub-field.
   * @returns {object} - Inserted node definitions.
   */
  async insertNodeDef(parentNodeDef, parentPath, collectNodeDef, type, field = null) {
    const { surveyId, defaultLanguage } = this.context

    const nodeDefsUpdated = {}
    const nodeDefsInserted = {}

    // 1. determine basic props
    const collectNodeDefName = CollectSurvey.getAttribute('name')(collectNodeDef)
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)
    const calculated = CollectSurvey.getAttributeBoolean('calculated')(collectNodeDef)
    const key = CollectSurvey.getAttributeBoolean('key')(collectNodeDef)

    const collectNodeDefPath = `${parentPath}/${collectNodeDefName}`

    const tableLayout =
      multiple &&
      CollectSurvey.getUiAttribute('layout', CollectSurvey.layoutTypes.table)(collectNodeDef) ===
        CollectSurvey.layoutTypes.table

    const nodeDefNameSuffix = field ? `_${field}` : ''

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(parentNodeDef, collectNodeDefName + nodeDefNameSuffix),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && key,
      [NodeDef.propKeys.labels]: this.extractLabels(collectNodeDef, type, field, defaultLanguage),
      // Layout props (render)
      ...(type === NodeDef.nodeDefType.entity // Calculated
        ? {
            [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
              Survey.cycleOneKey,
              tableLayout ? NodeDefLayout.renderType.table : NodeDefLayout.renderType.form,
              determineNodeDefPageUuid(type, collectNodeDef)
            ),
          }
        : {
            [NodeDef.propKeys.readOnly]: calculated,
          }),
      // Extra props
      ...this.extractNodeDefExtraProps(type, collectNodeDef),
    }

    // 2. insert node def into db
    const nodeDefParam = _createNodeDef(parentNodeDef, type, props)
    const nodeDefUuid = NodeDef.getUuid(nodeDefParam)

    Object.assign(
      nodeDefsUpdated,
      await NodeDefManager.insertNodeDef({ user: this.user, surveyId, nodeDef: nodeDefParam, system: true }, this.tx)
    )

    let nodeDef = nodeDefsUpdated[nodeDefUuid]

    // 2a. increment processed items before recursive call to insertNodeDef
    this.incrementProcessedItems()

    // 3. insert children and updated layout props
    const propsUpdated = {}

    if (type === NodeDef.nodeDefType.entity) {
      // 3a. insert child definitions
      const childrenUuids = await this.insertNodeDefChildren(nodeDef, collectNodeDefPath, collectNodeDef, tableLayout)

      if (tableLayout) {
        // Update layout prop
        propsUpdated[NodeDefLayout.keys.layout] = R.pipe(
          NodeDefLayout.getLayout,
          R.assocPath([Survey.cycleOneKey, NodeDefLayout.keys.layoutChildren], childrenUuids)
        )(nodeDef)
      }
    } else if (type === NodeDef.nodeDefType.code) {
      // Add parent code def uuid
      const parentCodeDefUuid = await this._getCodeParentUuid(nodeDef, parentPath, collectNodeDef)
      if (parentCodeDefUuid) {
        propsUpdated[NodeDef.propKeys.parentCodeDefUuid] = parentCodeDefUuid
      }

      // 3b. add specify text attribute def
      const {
        nodeDefsUpdated: qualifierNodeDefsUpdaetd,
        nodeDefsInserted: qualifierNodeDefsInserted,
      } = await this.addSpecifyTextAttribute(parentNodeDef, nodeDef)

      Object.assign(nodeDefsUpdated, qualifierNodeDefsUpdaetd)
      Object.assign(nodeDefsInserted, qualifierNodeDefsInserted)
    }

    // 4. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvancedProps({ nodeDef, type, collectNodeDef })

    Object.assign(
      nodeDefsUpdated,
      await NodeDefManager.updateNodeDefProps(
        this.user,
        surveyId,
        nodeDefUuid,
        NodeDef.getParentUuid(nodeDef),
        propsUpdated,
        propsAdvanced,
        true,
        this.tx
      )
    )
    nodeDef = nodeDefsUpdated[nodeDefUuid]

    // 5. store nodeDef in cache
    let nodeDefsInfo = this.nodeDefsInfoByCollectPath[collectNodeDefPath]
    if (!nodeDefsInfo) {
      nodeDefsInfo = []
      this.nodeDefsInfoByCollectPath[collectNodeDefPath] = nodeDefsInfo
    }

    nodeDefsInfo.push({
      uuid: nodeDefUuid,
      ...(field ? { field } : {}),
    })

    nodeDefsInserted[nodeDefUuid] = nodeDef

    Object.assign(this.nodeDefs, { ...nodeDefsInserted, ...nodeDefsUpdated })

    return nodeDefsInserted
  }

  async insertNodeDefChildren(nodeDef, collectNodeDefPath, collectNodeDef, tableLayout) {
    const childrenUuids = []
    for (const collectChild of collectNodeDef.elements) {
      if (this.isCanceled()) break

      const childDefFields = CollectSurvey.getNodeDefFieldsByCollectNodeDef(collectChild)

      if (childDefFields) {
        for (const childDefField of childDefFields) {
          const { type: childType, field = null } = childDefField

          const nodeDefsInserted = await this.insertNodeDef(nodeDef, collectNodeDefPath, collectChild, childType, field)
          // sort inserted node defs by id
          const insertedUuids = R.pipe(R.values, R.sortBy(NodeDef.getId), R.map(NodeDef.getUuid))(nodeDefsInserted)
          if (tableLayout) {
            childrenUuids.push(...insertedUuids)
          }
        }
      }
    }

    return childrenUuids
  }

  extractLabels(collectNodeDef, type, field, defaultLang) {
    let suffix = field ? ` (${field})` : ''
    if (type === NodeDef.nodeDefType.integer || type === NodeDef.nodeDefType.decimal) {
      // Add unit suffix to every label, if specified
      const elPrecision = CollectSurvey.getElementByName('precision')(collectNodeDef)
      if (elPrecision) {
        const unit = CollectSurvey.getAttribute('unit')(elPrecision)
        suffix += ` [${unit}]`
      }
    }
    return CollectSurvey.toLabels('label', defaultLang, ['instance', 'heading'], suffix)(collectNodeDef)
  }

  async extractNodeDefAdvancedProps({ nodeDef, type, collectNodeDef }) {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)

    const propsAdvanced = {}

    // 1. default values
    const defaultValues = await this.parseNodeDefDefaultValues({ nodeDef, collectNodeDef })

    if (!R.isEmpty(defaultValues)) {
      propsAdvanced[NodeDef.keysPropsAdvanced.defaultValues] = defaultValues
    }

    // 2. validations
    const validations = {
      ...(multiple
        ? {
            [NodeDefValidations.keys.count]: {
              [NodeDefValidations.keys.min]: CollectSurvey.getAttribute('minCount')(collectNodeDef),
              [NodeDefValidations.keys.max]: CollectSurvey.getAttribute('maxCount')(collectNodeDef),
            },
          }
        : {
            [NodeDefValidations.keys.required]: CollectSurvey.getAttribute('required')(collectNodeDef),
          }),
    }

    if (type !== NodeDef.nodeDefType.entity) {
      const validationRules = await this.parseNodeDefValidationRules({ nodeDef, collectNodeDef })
      validations[NodeDefValidations.keys.expressions] = validationRules
    }
    propsAdvanced[NodeDef.keysPropsAdvanced.validations] = validations

    // 3. applicable
    const relevantExpr = CollectSurvey.getAttribute('relevant')(collectNodeDef)
    if (relevantExpr) {
      try {
        const relevantExprConverted = CollectExpressionConverter.convert({
          survey: this.survey,
          nodeDefCurrent: nodeDef,
          expression: relevantExpr,
        })
        // propsAdvanced[NodeDef.keysPropsAdvanced.applicable] =
      } catch (e) {
        await this.addNodeDefImportIssue(nodeDefUuid, CollectImportReportItem.exprTypes.applicable, relevantExpr)
      }
    }

    return propsAdvanced
  }

  extractNodeDefExtraProps(type, collectNodeDef) {
    switch (type) {
      case NodeDef.nodeDefType.code: {
        const listName = CollectSurvey.getAttribute('list')(collectNodeDef)
        const categoryName = R.includes(listName, CollectSurvey.samplingPointDataCodeListNames)
          ? SamplingPointDataImportJob.categoryName
          : listName
        const category = CollectImportJobContext.getCategoryByName(categoryName)(this.context)

        const layoutCollect = CollectSurvey.getUiAttribute('layoutType')(collectNodeDef)
        const renderType =
          layoutCollect === 'radio' ? NodeDefLayout.renderType.checkbox : NodeDefLayout.renderType.dropdown

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
          [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(Survey.cycleOneKey, renderType),
        }
      }

      case NodeDef.nodeDefType.taxon: {
        const taxonomyName = CollectSurvey.getAttribute('taxonomy')(collectNodeDef)
        const taxonomy = CollectImportJobContext.getTaxonomyByName(taxonomyName)(this.context)

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy),
        }
      }

      default:
        return {}
    }
  }

  async parseNodeDefDefaultValues({ nodeDef, collectNodeDef }) {
    const { defaultLanguage } = this.context

    const collectDefaultValues = CollectSurvey.getElementsByName('default')(collectNodeDef)

    const defaultValues = []

    await PromiseUtils.each(collectDefaultValues, async (collectDefaultValue) => {
      const { value, expr, applyIf } = CollectSurvey.getAttributes(collectDefaultValue)

      let exprConverted = null
      let applyIfConverted = null
      if (StringUtils.isNotBlank(value)) {
        // Default value is a constant
        exprConverted = JSON.stringify(value)
      } else if (StringUtils.isNotBlank(expr) || StringUtils.isNotBlank(applyIf)) {
        try {
          exprConverted = CollectExpressionConverter.convert({
            survey: this.survey,
            nodeDefCurrent: nodeDef,
            expression: expr,
          })
          applyIfConverted = CollectExpressionConverter.convert({
            survey: this.survey,
            nodeDefCurrent: nodeDef,
            expression: applyIf,
          })
        } catch (e) {
          const messages = CollectSurvey.toLabels('messages', defaultLanguage)(collectDefaultValue)
          await this.addNodeDefImportIssue(
            NodeDef.getUuid(nodeDef),
            CollectImportReportItem.exprTypes.defaultValue,
            expr,
            applyIf,
            messages
          )
        }
      } else {
        this.logDebug('empty value found in default attribute constant value')
      }
      if (exprConverted !== null) {
        defaultValues.push({
          [ObjectUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: exprConverted,
          [NodeDefExpression.keys.applyIf]: applyIfConverted,
        })
      }
    })

    return defaultValues
  }

  async parseNodeDefValidationRules({ nodeDef: nodeDefCurrent, collectNodeDef }) {
    const { defaultLanguage } = this.context

    const validationRules = []
    const elements = CollectSurvey.getElements(collectNodeDef)
    await PromiseUtils.each(elements, async (element) => {
      const checkType = CollectSurvey.getElementName(element)
      const checkExpressionParser = checkExpressionParserByType[checkType]
      if (checkExpressionParser) {
        const collectExpr = checkExpressionParser(element)
        const messages = CollectSurvey.toLabels('message', defaultLanguage)(element)
        const { if: condition, flag, expr } = CollectSurvey.getAttributes(element)
        try {
          let exprConverted = null
          if (checkType === collectCheckType.distance) {
            const { max, to } = CollectSurvey.getAttributes(element)
            const toConverted = CollectExpressionConverter.convert({
              survey: this.survey,
              nodeDefCurrent,
              expression: to,
            })
            exprConverted = `distance(${nodeDefCurrent}, ${toConverted}) <== ${max}`
          } else {
            exprConverted = CollectExpressionConverter.convert({
              survey: this.survey,
              nodeDefCurrent,
              expression: expr,
            })
          }
          const conditionConverted = CollectExpressionConverter.convert({
            survey: this.survey,
            nodeDefCurrent,
            expression: condition,
          })
          validationRules.push({
            [ObjectUtils.keys.uuid]: uuidv4(),
            [NodeDefExpression.keys.expression]: exprConverted,
            [NodeDefExpression.keys.applyIf]: conditionConverted,
          })
        } catch (e) {
          const exprType =
            flag === 'error'
              ? CollectImportReportItem.exprTypes.validationRuleError
              : CollectImportReportItem.exprTypes.validationRuleWarning
          await this.addNodeDefImportIssue(NodeDef.getUuid(nodeDefCurrent), exprType, collectExpr, condition, messages)
        }
      }
    })
    return validationRules
  }

  getUniqueNodeDefName(parentNodeDef, collectNodeDefName) {
    let finalName = collectNodeDefName

    if (R.includes(finalName, this.nodeDefNames) || Validator.isKeyword(finalName)) {
      // Name is in use or is a keyword

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getName(parentNodeDef)}_${finalName}`
      }

      if (R.includes(finalName, this.nodeDefNames)) {
        // Try to make it unique by adding _# suffix
        const prefix = finalName + '_'
        let count = 1
        finalName = prefix + count
        while (R.includes(finalName, this.nodeDefNames)) {
          finalName = prefix + ++count
        }
      }
    }

    this.nodeDefNames.push(finalName)

    return finalName
  }

  async addNodeDefImportIssue(nodeDefUuid, expressionType, expression = null, applyIf = null, messages = {}) {
    await CollectImportReportManager.insertItem(
      this.surveyId,
      nodeDefUuid,
      CollectImportReportItem.newReportItem(expressionType, expression, applyIf, messages),
      this.tx
    )

    this.issuesCount++
  }

  /**
   * Adds a text attribute with name ${nodeDefName}_${qualifiableCode} (for each 'qualifiable' code list item in the list)
   */
  async addSpecifyTextAttribute(parentNodeDef, nodeDef) {
    const categories = this.getContextProp('categories', {})
    const category = R.find((category) => Category.getUuid(category) === NodeDef.getCategoryUuid(nodeDef), categories)
    const categoryName = Category.getName(category)
    const survey = this.survey
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)

    const qualifiableItemCodesByCategoryAndLevel = this.getContextProp('qualifiableItemCodesByCategoryAndLevel', {})
    const qualifiableItemCodes = R.pathOr(
      [],
      [categoryName, String(levelIndex)],
      qualifiableItemCodesByCategoryAndLevel
    )

    const nodeDefsUpdated = {} //all updated and inserted node defs
    const nodeDefsInserted = {} // only newly inserted node defs

    for (const itemCode of qualifiableItemCodes) {
      const nodeDefName = NodeDef.getName(nodeDef)
      const props = {
        [NodeDef.propKeys.name]: this.getUniqueNodeDefName(
          parentNodeDef,
          `${nodeDefName}_${StringUtils.normalizeName(itemCode)}`
        ),
        [NodeDef.propKeys.labels]: R.pipe(
          NodeDef.getLabels,
          R.mapObjIndexed((label) => `${label} ${specifyAttributeSuffix}`)
        )(nodeDef),
      }

      const applicableIfExpr = NodeDef.isSingle(nodeDef)
        ? `${nodeDefName} == "${itemCode}"`
        : `includes(${nodeDefName}, "${itemCode}")
        `

      const propsAdvanced = {
        [NodeDef.keysPropsAdvanced.applicable]: [NodeDefExpression.createExpression(applicableIfExpr)],
      }
      const qualifierNodeDefParam = _createNodeDef(parentNodeDef, NodeDef.nodeDefType.text, props, propsAdvanced)
      const qualifierNodeDefAndOthersUpdated = await NodeDefManager.insertNodeDef(
        {
          user: this.user,
          surveyId: this.surveyId,
          nodeDef: qualifierNodeDefParam,
          system: true,
        },
        this.tx
      )
      const qualifierNodeDefUuid = NodeDef.getUuid(qualifierNodeDefParam)
      nodeDefsInserted[qualifierNodeDefUuid] = qualifierNodeDefAndOthersUpdated[qualifierNodeDefUuid]
      Object.assign(nodeDefsUpdated, R.omit(qualifierNodeDefUuid, qualifierNodeDefAndOthersUpdated))
    }
    return { nodeDefsInserted, nodeDefsUpdated }
  }

  _calculateTotal() {
    const { collectSurvey } = this.context
    let count = 0

    const collectNodeDefRoot = CollectSurvey.getNodeDefRoot(collectSurvey)

    const stack = []
    stack.push(collectNodeDefRoot)

    while (stack.length > 0) {
      const collectNodeDef = stack.pop()

      count++

      if (CollectSurvey.getElementName(collectNodeDef) === NodeDef.nodeDefType.entity) {
        for (const collectNodeDefChild of CollectSurvey.getElements(collectNodeDef)) {
          if (this.isCanceled()) {
            break
          }

          const childDefFields = CollectSurvey.getNodeDefFieldsByCollectNodeDef(collectNodeDefChild)

          if (childDefFields) {
            stack.push(collectNodeDefChild)
          }
        }
      }
    }

    this.total = count
  }

  async _getCodeParentUuid(nodeDef, parentPath, collectNodeDef) {
    const collectCodeParentExpr = NodeDef.nodeDefType.code ? CollectSurvey.getAttribute('parent')(collectNodeDef) : null
    if (collectCodeParentExpr) {
      const collectNodeDefParentPathParts = parentPath.split('/')
      const codeParentExprParts = collectCodeParentExpr.split('/')

      for (let index = 0; index < codeParentExprParts.length - 1; index++) {
        const part = codeParentExprParts[index]
        if (part === 'parent()') {
          collectNodeDefParentPathParts.pop()
        } else {
          // Unsupported expression
          await this.addNodeDefImportIssue(
            NodeDef.getUuid(nodeDef),
            CollectImportReportItem.exprTypes.codeParent,
            collectCodeParentExpr
          )
          return null
        }
      }

      const codeParentPath = `${collectNodeDefParentPathParts.join('/')}/${
        codeParentExprParts[codeParentExprParts.length - 1]
      }`
      const nodeDefInfosCodeParent = this.nodeDefsInfoByCollectPath[codeParentPath]

      return R.pipe(R.head, R.propOr(null, 'uuid'))(nodeDefInfosCodeParent)
    }

    return null
  }

  get survey() {
    return Survey.assocNodeDefs({ nodeDefs: this.nodeDefs, updateDependencyGraph: true })({})
  }
}

const _createNodeDef = (parentNodeDef, type, props, propsAdvanced = {}) =>
  NodeDef.newNodeDef(parentNodeDef, type, [Survey.cycleOneKey], props, propsAdvanced)

const determineNodeDefPageUuid = (type, collectNodeDef) => {
  if (type === NodeDef.nodeDefType.entity) {
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)
    if (multiple) {
      const tab = CollectSurvey.getUiAttribute('tab')(collectNodeDef)

      if (tab) {
        // Multiple entity own tab => own page
        return uuidv4()
      }

      // Multiple entity w/o tab => parent page
      return null
    }

    // Single entity => own page
    return uuidv4()
  }

  // Attribute => parent page
  return null
}

NodeDefsImportJob.type = 'NodeDefsImportJob'
