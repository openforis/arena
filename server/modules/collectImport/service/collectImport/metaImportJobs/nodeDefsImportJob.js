import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'

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
import * as CollectImportJobContext from '../collectImportJobContext'
import * as CollectImportReportManager from '../../../manager/collectImportReportManager'
import * as CollectSurvey from '../model/collectSurvey'
import SamplingPointDataImportJob from './samplingPointDataImportJob'

const specifyAttributeSuffix = 'specify'

const checkExpressionParserByType = {
  compare: collectCheck => {
    const attributeToOperator = {
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
    }
    const exprParts = []

    const attributes = CollectSurvey.getAttributes(collectCheck)
    for (const attr of R.keys(attributes)) {
      const operator = attributeToOperator[attr]
      if (operator) {
        exprParts.push(`$this ${operator} ${attributes[attr]}`)
      }
    }

    return R.join(' and ', exprParts)
  },
  check: collectCheck => {
    const { expr } = CollectSurvey.getAttributes(collectCheck)
    return expr
  },
  distance: collectCheck => {
    const { max, to } = CollectSurvey.getAttributes(collectCheck)
    return `distance from $this to ${to} must be <= ${max}m`
  },
  pattern: collectCheck => {
    const { regex } = CollectSurvey.getAttributes(collectCheck)
    return `$this must respect the pattern: ${regex}`
  },
  unique: collectCheck => {
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
    const { tx } = this
    const { collectSurvey, surveyId, user } = this.context

    this._calculateTotal()

    // Insert root entity and descendants recursively
    const collectRootDef = CollectSurvey.getNodeDefRoot(collectSurvey)

    await this.insertNodeDef(
      surveyId,
      null,
      '',
      collectRootDef,
      NodeDef.nodeDefType.entity,
      tx,
    )

    const collectReport = {
      [Survey.collectReportKeys.issuesTotal]: this.issuesCount,
      [Survey.collectReportKeys.issuesResolved]: 0,
    }
    await SurveyManager.updateSurveyProp(
      user,
      surveyId,
      Survey.infoKeys.collectReport,
      collectReport,
      true,
      tx,
    )

    // Fetch survey and store it in context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      surveyId,
      Survey.cycleOneKey,
      true,
      true,
      false,
      false,
      tx,
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
   */
  async insertNodeDef(
    surveyId,
    parentNodeDef,
    parentPath,
    collectNodeDef,
    type,
    tx,
    field = null,
  ) {
    const { defaultLanguage } = this.context

    // 1. determine basic props
    const collectNodeDefName = CollectSurvey.getAttribute('name')(
      collectNodeDef,
    )
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(
      collectNodeDef,
    )
    const calculated = CollectSurvey.getAttributeBoolean('calculated')(
      collectNodeDef,
    )
    const key = CollectSurvey.getAttributeBoolean('key')(collectNodeDef)

    const collectNodeDefPath = parentPath + '/' + collectNodeDefName

    const tableLayout =
      multiple &&
      CollectSurvey.getUiAttribute(
        'layout',
        CollectSurvey.layoutTypes.table,
      )(collectNodeDef) === CollectSurvey.layoutTypes.table

    const nodeDefNameSuffix = field ? `_${field}` : ''
    const nodeDefLabelSuffix = field ? ` (${field})` : ''

    const props = {
      [NodeDef.propKeys.name]: this.getUniqueNodeDefName(
        parentNodeDef,
        collectNodeDefName + nodeDefNameSuffix,
      ),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && key,
      [NodeDef.propKeys.labels]: CollectSurvey.toLabels(
        'label',
        defaultLanguage,
        ['instance', 'heading'],
        nodeDefLabelSuffix,
      )(collectNodeDef),
      // Layout props (render)
      ...(type === NodeDef.nodeDefType.entity // Calculated
        ? {
            [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
              Survey.cycleOneKey,
              tableLayout
                ? NodeDefLayout.renderType.table
                : NodeDefLayout.renderType.form,
              determineNodeDefPageUuid(type, collectNodeDef),
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
    let nodeDef = await NodeDefManager.insertNodeDef(
      this.user,
      surveyId,
      nodeDefParam,
      true,
      tx,
    )
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    // 2a. increment processed items before recursive call to insertNodeDef
    this.incrementProcessedItems()

    // 3. insert children and updated layout props
    const propsUpdated = {}

    if (type === NodeDef.nodeDefType.entity) {
      // 3a. insert child definitions

      const childrenUuids = []

      for (const collectChild of collectNodeDef.elements) {
        if (this.isCanceled()) {
          break
        }

        const childDefFields = CollectSurvey.getNodeDefFieldsByCollectNodeDef(
          collectChild,
        )

        if (childDefFields) {
          for (const childDefField of childDefFields) {
            const { type: childType, field = null } = childDefField
            const childDef = await this.insertNodeDef(
              surveyId,
              nodeDef,
              collectNodeDefPath,
              collectChild,
              childType,
              tx,
              field,
            )
            if (tableLayout) {
              childrenUuids.push(NodeDef.getUuid(childDef))
            }
          }
        }
      }

      if (tableLayout) {
        // Update layout prop
        propsUpdated[NodeDefLayout.keys.layout] = R.pipe(
          NodeDefLayout.getLayout,
          R.assocPath(
            [Survey.cycleOneKey, NodeDefLayout.keys.layoutChildren],
            childrenUuids,
          ),
        )(nodeDef)
      }
    } else if (type === NodeDef.nodeDefType.code) {
      // Add parent code def uuid
      const parentCodeDefUuid = await this._getCodeParentUuid(
        nodeDef,
        parentPath,
        collectNodeDef,
      )
      if (parentCodeDefUuid) {
        propsUpdated[NodeDef.propKeys.parentCodeDefUuid] = parentCodeDefUuid
      }

      // 3b. add specify text attribute def
      await this.addSpecifyTextAttribute(surveyId, parentNodeDef, nodeDef, tx)
    }

    // 4. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvancedProps(
      parentNodeDef,
      nodeDefUuid,
      type,
      collectNodeDef,
      tx,
    )

    nodeDef = (
      await NodeDefManager.updateNodeDefProps(
        this.user,
        surveyId,
        nodeDefUuid,
        propsUpdated,
        propsAdvanced,
        true,
        tx,
      )
    )[nodeDefUuid]

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

    this.nodeDefs[nodeDefUuid] = nodeDef

    return nodeDef
  }

  async extractNodeDefAdvancedProps(
    parentNodeDef,
    nodeDefUuid,
    type,
    collectNodeDef,
    tx,
  ) {
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(
      collectNodeDef,
    )

    const propsAdvanced = {}

    // 1. default values
    const defaultValues = await this.parseNodeDefDefaultValues(
      nodeDefUuid,
      collectNodeDef,
      tx,
    )

    if (!R.isEmpty(defaultValues)) {
      propsAdvanced[NodeDef.propKeys.defaultValues] = defaultValues
    }

    // 2. validations
    propsAdvanced[NodeDef.propKeys.validations] = {
      ...(multiple
        ? {
            [NodeDefValidations.keys.count]: {
              [NodeDefValidations.keys.min]: CollectSurvey.getAttribute(
                'minCount',
              )(collectNodeDef),
              [NodeDefValidations.keys.max]: CollectSurvey.getAttribute(
                'maxCount',
              )(collectNodeDef),
            },
          }
        : {
            [NodeDefValidations.keys.required]: CollectSurvey.getAttribute(
              'required',
            )(collectNodeDef),
          }),
    }

    if (type !== NodeDef.nodeDefType.entity) {
      await this.parseNodeDefValidationRules(nodeDefUuid, collectNodeDef, tx)
    }

    // 3. applicable (not supported)
    const relevantExpr = CollectSurvey.getAttribute('relevant')(collectNodeDef)
    if (relevantExpr) {
      await this.addNodeDefImportIssue(
        nodeDefUuid,
        CollectImportReportItem.exprTypes.applicable,
        relevantExpr,
        null,
        null,
        tx,
      )
    }

    return propsAdvanced
  }

  extractNodeDefExtraProps(type, collectNodeDef) {
    switch (type) {
      case NodeDef.nodeDefType.code: {
        const listName = CollectSurvey.getAttribute('list')(collectNodeDef)
        const categoryName = R.includes(
          listName,
          CollectSurvey.samplingPointDataCodeListNames,
        )
          ? SamplingPointDataImportJob.categoryName
          : listName
        const category = CollectImportJobContext.getCategoryByName(
          categoryName,
        )(this.context)

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
          [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
            Survey.cycleOneKey,
            NodeDefLayout.renderType.dropdown,
          ),
        }
      }

      case NodeDef.nodeDefType.taxon: {
        const taxonomyName = CollectSurvey.getAttribute('taxonomy')(
          collectNodeDef,
        )
        const taxonomy = CollectImportJobContext.getTaxonomyByName(
          taxonomyName,
        )(this.context)

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy),
        }
      }

      default:
        return {}
    }
  }

  async parseNodeDefDefaultValues(nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const collectDefaultValues = CollectSurvey.getElementsByName('default')(
      collectNodeDef,
    )

    const defaultValues = []

    for (const collectDefaultValue of collectDefaultValues) {
      const { value, expr, applyIf } = CollectSurvey.getAttributes(
        collectDefaultValue,
      )
      if (StringUtils.isNotBlank(expr) || StringUtils.isNotBlank(applyIf)) {
        const messages = CollectSurvey.toLabels(
          'messages',
          defaultLanguage,
        )(collectDefaultValue)
        await this.addNodeDefImportIssue(
          nodeDefUuid,
          CollectImportReportItem.exprTypes.defaultValue,
          expr,
          applyIf,
          messages,
          tx,
        )
      } else if (StringUtils.isNotBlank(value)) {
        defaultValues.push({
          [ObjectUtils.keys.uuid]: uuidv4(),
          [NodeDefExpression.keys.expression]: value,
        })
      } else {
        this.logDebug('empty value found in default attribute constant value')
      }
    }

    return defaultValues
  }

  async parseNodeDefValidationRules(nodeDefUuid, collectNodeDef, tx) {
    const { defaultLanguage } = this.context

    const elements = CollectSurvey.getElements(collectNodeDef)
    for (const element of elements) {
      const checkExpressionParser =
        checkExpressionParserByType[CollectSurvey.getElementName(element)]
      if (checkExpressionParser) {
        const collectExpr = checkExpressionParser(element)
        const messages = CollectSurvey.toLabels(
          'message',
          defaultLanguage,
        )(element)
        const { condition } = CollectSurvey.getAttributes(element)

        await this.addNodeDefImportIssue(
          nodeDefUuid,
          CollectImportReportItem.exprTypes.validationRules,
          collectExpr,
          condition,
          messages,
          tx,
        )
      }
    }
  }

  getUniqueNodeDefName(parentNodeDef, collectNodeDefName) {
    let finalName = collectNodeDefName

    if (
      R.includes(finalName, this.nodeDefNames) ||
      Validator.isKeyword(finalName)
    ) {
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

  async addNodeDefImportIssue(
    nodeDefUuid,
    expressionType,
    expression,
    applyIf,
    messages,
    tx,
  ) {
    await CollectImportReportManager.insertItem(
      this.surveyId,
      nodeDefUuid,
      CollectImportReportItem.newReportItem(
        expressionType,
        expression || null,
        applyIf || null,
        messages || {},
      ),
      tx,
    )

    this.issuesCount++
  }

  /**
   * Adds a text attribute with name ${nodeDefName}_${qualifiableCode} (for each 'qualifiable' code list item in the list)
   */
  async addSpecifyTextAttribute(surveyId, parentNodeDef, nodeDef, tx) {
    const categories = this.getContextProp('categories', {})
    const category = R.find(
      category =>
        Category.getUuid(category) === NodeDef.getCategoryUuid(nodeDef),
      categories,
    )
    const categoryName = Category.getName(category)
    const survey = {
      nodeDefs: this.nodeDefs,
    }
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(survey)

    const qualifiableItemCodesByCategoryAndLevel = this.getContextProp(
      'qualifiableItemCodesByCategoryAndLevel',
      {},
    )
    const qualifiableItemCodes = R.pathOr(
      [],
      [categoryName, String(levelIndex)],
      qualifiableItemCodesByCategoryAndLevel,
    )

    for (const itemCode of qualifiableItemCodes) {
      const nodeDefName = NodeDef.getName(nodeDef)
      const props = {
        [NodeDef.propKeys.name]: this.getUniqueNodeDefName(
          parentNodeDef,
          `${nodeDefName}_${StringUtils.normalizeName(itemCode)}`,
        ),
        [NodeDef.propKeys.labels]: R.pipe(
          NodeDef.getLabels,
          R.mapObjIndexed(label => `${label} ${specifyAttributeSuffix}`),
        )(nodeDef),
      }
      const qualifierNodeDefParam = _createNodeDef(
        parentNodeDef,
        NodeDef.nodeDefType.text,
        props,
      )
      const qualifierNodeDef = await NodeDefManager.insertNodeDef(
        this.user,
        surveyId,
        qualifierNodeDefParam,
        true,
        tx,
      )
      const propsAdvanced = {
        [NodeDef.propKeys.applicable]: [
          NodeDefExpression.createExpression(`${nodeDefName} == "${itemCode}"`),
        ],
      }
      await NodeDefManager.updateNodeDefProps(
        this.user,
        this.surveyId,
        NodeDef.getUuid(qualifierNodeDef),
        {},
        propsAdvanced,
        true,
        tx,
      )

      this.nodeDefs[NodeDef.getUuid(qualifierNodeDef)] = qualifierNodeDef
    }
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

      if (
        CollectSurvey.getElementName(collectNodeDef) ===
        NodeDef.nodeDefType.entity
      ) {
        for (const collectNodeDefChild of CollectSurvey.getElements(
          collectNodeDef,
        )) {
          if (this.isCanceled()) {
            break
          }

          const childDefFields = CollectSurvey.getNodeDefFieldsByCollectNodeDef(
            collectNodeDefChild,
          )

          if (childDefFields) {
            stack.push(collectNodeDefChild)
          }
        }
      }
    }

    this.total = count
  }

  async _getCodeParentUuid(nodeDef, parentPath, collectNodeDef) {
    const collectCodeParentExpr = NodeDef.nodeDefType.code
      ? CollectSurvey.getAttribute('parent')(collectNodeDef)
      : null
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
            collectCodeParentExpr,
            null,
            null,
            this.tx,
          )
          return null
        }
      }

      const codeParentPath = `${collectNodeDefParentPathParts.join('/')}/${
        codeParentExprParts[codeParentExprParts.length - 1]
      }`
      const nodeDefInfosCodeParent = this.nodeDefsInfoByCollectPath[
        codeParentPath
      ]

      return R.pipe(R.head, R.propOr(null, 'uuid'))(nodeDefInfosCodeParent)
    }

    return null
  }
}

const _createNodeDef = (parentNodeDef, type, props) =>
  NodeDef.newNodeDef(parentNodeDef, type, Survey.cycleOneKey, props)

const determineNodeDefPageUuid = (type, collectNodeDef) => {
  if (type === NodeDef.nodeDefType.entity) {
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(
      collectNodeDef,
    )
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
