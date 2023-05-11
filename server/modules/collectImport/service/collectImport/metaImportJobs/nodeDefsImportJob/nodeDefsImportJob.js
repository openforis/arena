import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as StringUtils from '@core/stringUtils'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'

import Job from '@server/job/job'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as CollectImportReportManager from '../../../../manager/collectImportReportManager'
import * as CollectSurvey from '../../model/collectSurvey'
import NodeDefUniqueNameGenerator from '../../model/nodeDefUniqueNameGenerator'
import { CollectExpressionConverter } from './collectExpressionConverter'
import { parseValidationRules } from './validationRuleParser'
import { parseDefaultValues } from './defaultValueParser'

const specifyAttributeNameSuffix = '_specify'
const specifyAttributeLabelSuffix = ' (Specify)'

const arenaFileTypeByCollectFileType = {
  AUDIO: NodeDef.fileTypeValues.audio,
  DOCUMENT: NodeDef.fileTypeValues.other,
  IMAGE: NodeDef.fileTypeValues.image,
  VIDEO: NodeDef.fileTypeValues.video,
}

export default class NodeDefsImportJob extends Job {
  constructor(params) {
    super(NodeDefsImportJob.type, params)

    this.nodeDefs = {} // Node definitions by uuid
    this.nodeDefUniqueNameGenerator = new NodeDefUniqueNameGenerator() // to avoid naming collision
    this.nodeDefsInfoByCollectPath = {} // Used by following jobs
    this.importIssues = []
  }

  async execute() {
    const { collectSurvey, surveyId, user } = this.context

    this._calculateTotal()

    // Insert root entity and descendants recursively
    const collectRootDef = CollectSurvey.getNodeDefRoot(collectSurvey)

    await this.insertNodeDef(null, '', collectRootDef, NodeDef.nodeDefType.entity)

    // insert import issues and write report into survey props
    await CollectImportReportManager.insertItems({ surveyId: this.surveyId, items: this.importIssues }, this.tx)

    const collectReport = {
      [Survey.collectReportKeys.issuesTotal]: this.importIssues.length,
      [Survey.collectReportKeys.issuesResolved]: 0,
    }
    await SurveyManager.updateSurveyProp(user, surveyId, Survey.infoKeys.collectReport, collectReport, true, this.tx)
    await SurveyManager.updateSurveyProp(
      user,
      surveyId,
      Survey.infoKeys.collectNodeDefsInfoByPath,
      this.nodeDefsInfoByCollectPath,
      true,
      this.tx
    )

    // Fetch survey and store it in context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle: Survey.cycleOneKey, draft: true, advanced: true },
      this.tx
    )

    this.setContext({
      nodeDefsInfoByCollectPath: this.nodeDefsInfoByCollectPath,
      [Job.keysContext.survey]: survey,
    })
  }

  /**
   * Inserts a node definition and all its descendants (if any).
   *
   * If field is specified, creates an attribute definition with `_${field}` as suffix for name and label
   * (used to import Collect composite attribute definitions like Range).
   *
   * @param {NodeDef} parentNodeDef - Parent node def definition.
   * @param {!string} parentPath - Parent node path.
   * @param {!object} collectNodeDef - Collect node definition.
   * @param {!string} type - Node definition type.
   * @param {string} field - Node sub-field.
   * @returns {Promise<object>} - Inserted node definitions.
   */
  async insertNodeDef(parentNodeDef, parentPath, collectNodeDef, type, field = null) {
    const { defaultLanguage } = this.context

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
      [NodeDef.propKeys.name]: this.nodeDefUniqueNameGenerator.getUniqueNodeDefName({
        parentNodeDefName: NodeDef.getName(parentNodeDef),
        nodeDefName: collectNodeDefName + nodeDefNameSuffix,
      }),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: NodeDef.canNodeDefTypeBeKey(type) && key,
      [NodeDef.propKeys.labels]: this.extractLabels(collectNodeDef, type, field, defaultLanguage),
      [NodeDef.propKeys.descriptions]: CollectSurvey.toLabels('description', defaultLanguage)(collectNodeDef),
      // Extra props
      ...this.extractNodeDefSpecificProps(type, collectNodeDef),
    }
    if (type === NodeDef.nodeDefType.entity) {
      // Layout props (render)
      props[NodeDefLayout.keys.layout] = NodeDefLayout.newLayout(
        Survey.cycleOneKey,
        tableLayout ? NodeDefLayout.renderType.table : NodeDefLayout.renderType.form,
        determineNodeDefPageUuid(type, collectNodeDef)
      )
    } else if (calculated) {
      // Calculated attribute
      props[NodeDef.propKeys.readOnly] = true
      const hidden = CollectSurvey.getUiAttribute('hide')(collectNodeDef)
      if (hidden) {
        props[NodeDef.propKeys.hidden] = true
      }
    }

    // 2. insert node def into db
    const nodeDefParam = _createNodeDef(parentNodeDef, type, props)
    const nodeDefUuid = NodeDef.getUuid(nodeDefParam)

    Object.assign(
      nodeDefsUpdated,
      await NodeDefManager.insertNodeDef(
        { user: this.user, survey: this.survey, nodeDef: nodeDefParam, system: true },
        this.tx
      )
    )
    Object.assign(this.nodeDefs, nodeDefsUpdated)

    let nodeDef = nodeDefsUpdated[nodeDefUuid]

    // 2a. increment processed items before recursive call to insertNodeDef
    this.incrementProcessedItems()

    // 3. insert children and updated layout props
    const propsUpdated = {}

    const _updateLayoutProp = ({ propName, value }) => {
      const layout = propsUpdated[NodeDefLayout.keys.layout] || NodeDef.getLayout(nodeDef)
      const layoutUpdated = R.assocPath([Survey.cycleOneKey, propName], value)(layout)
      propsUpdated[NodeDefLayout.keys.layout] = layoutUpdated
    }

    // 3 update node type specific props
    if (type === NodeDef.nodeDefType.entity) {
      // 3a. insert child definitions
      const childrenUuids = await this.insertNodeDefChildren(nodeDef, collectNodeDefPath, collectNodeDef, tableLayout)
      // current node def layout could have been modified during children insert; keep the latest version of it
      nodeDef = this.nodeDefs[nodeDefUuid]

      if (tableLayout) {
        _updateLayoutProp({ propName: NodeDefLayout.keys.layoutChildren, value: childrenUuids })
      }
    } else if (type === NodeDef.nodeDefType.code) {
      // 3b. Add parent code def uuid
      const parentCodeDefUuid = await this._getCodeParentUuid(nodeDef, parentPath, collectNodeDef)
      if (parentCodeDefUuid) {
        propsUpdated[NodeDef.propKeys.parentCodeDefUuid] = parentCodeDefUuid
      }

      // 3c. show code prop
      const codeShown = CollectSurvey.getUiAttribute('showCode', true)(collectNodeDef)
      if (!codeShown) {
        // code shown is true by default
        _updateLayoutProp({ propName: NodeDefLayout.keys.codeShown, value: codeShown })
      }

      // 3d. add specify text attribute def
      const { nodeDefsUpdated: qualifierNodeDefsUpdated, nodeDefsInserted: qualifierNodeDefsInserted } =
        await this.addSpecifyTextAttribute(parentNodeDef, nodeDef)

      Object.assign(nodeDefsUpdated, qualifierNodeDefsUpdated)
      Object.assign(nodeDefsInserted, qualifierNodeDefsInserted)
    } else if (type === NodeDef.nodeDefType.coordinate) {
      // 3e. allowOnlyDeviceCoordinate
      const allowOnlyDeviceCoordinate = CollectSurvey.getUiAttribute('allowOnlyDeviceCoordinate', false)(collectNodeDef)
      if (allowOnlyDeviceCoordinate) {
        propsUpdated[NodeDef.propKeys.allowOnlyDeviceCoordinate] = true
      }
    }

    // 4a. update hidden when not relevant layout prop
    const hiddenWhenNotRelevant = CollectSurvey.getUiAttribute('hideWhenNotRelevant', false)(collectNodeDef)
    if (hiddenWhenNotRelevant) {
      _updateLayoutProp({ propName: NodeDefLayout.keys.hiddenWhenNotRelevant, value: hiddenWhenNotRelevant })
    }

    // 4b. update hiddenInMobile layout prop
    const relevantExpr = CollectSurvey.getAttribute('relevant')(collectNodeDef)
    const hiddenInMobile =
      StringUtils.isNotBlank(relevantExpr) &&
      ['env:desktop()', 'not(env:mobile())'].includes(relevantExpr.replaceAll(/\s/, ''))
    if (hiddenInMobile) {
      _updateLayoutProp({ propName: NodeDefLayout.keys.hiddenInMobile, value: true })
    }

    Object.assign(this.nodeDefs, nodeDefsInserted, nodeDefsUpdated)

    // 5. update node def with other props
    const propsAdvanced = await this.extractNodeDefAdvancedProps({ nodeDef, type, collectNodeDef })

    Object.assign(
      nodeDefsUpdated,
      await NodeDefManager.updateNodeDefProps(
        {
          user: this.user,
          survey: this.survey,
          nodeDefUuid,
          parentUuid: NodeDef.getParentUuid(nodeDef),
          props: propsUpdated,
          propsAdvanced,
          system: true,
        },
        this.tx
      )
    )
    nodeDef = nodeDefsUpdated[nodeDefUuid]

    // 6. store nodeDef in cache
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

    Object.assign(this.nodeDefs, nodeDefsInserted, nodeDefsUpdated)

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
        if (StringUtils.isNotBlank(unit)) {
          suffix += ` [${unit}]`
        }
      }
    }
    return CollectSurvey.toLabels('label', defaultLang, ['instance', 'heading'], suffix)(collectNodeDef)
  }

  async extractNodeDefAdvancedProps({ nodeDef, type, collectNodeDef }) {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const multiple = CollectSurvey.getAttributeBoolean('multiple')(collectNodeDef)

    const propsAdvanced = {}

    // 1. default values
    const defaultValues = await this.parseDefaultValues({ nodeDef, collectNodeDef })

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
      const { validationRules, unique } = this.parseValidationRules({ nodeDef, collectNodeDef })
      validations[NodeDefValidations.keys.expressions] = validationRules
      if (unique) {
        validations[NodeDefValidations.keys.unique] = true
      }
    }
    propsAdvanced[NodeDef.keysPropsAdvanced.validations] = validations

    // 3. applicable
    const relevantExpr = CollectSurvey.getAttribute('relevant')(collectNodeDef)
    if (StringUtils.isNotBlank(relevantExpr)) {
      const relevantExprConverted = CollectExpressionConverter.convert({
        survey: this.survey,
        nodeDefCurrent: nodeDef,
        expression: relevantExpr,
      })
      const success = relevantExprConverted !== null

      this.importIssues.push(
        CollectImportReportItem.newReportItem({
          nodeDefUuid,
          expressionType: CollectImportReportItem.exprTypes.applicable,
          expression: relevantExpr,
          resolved: success,
        })
      )

      if (success) {
        propsAdvanced[NodeDef.keysPropsAdvanced.applicable] = [
          NodeDefExpression.createExpression({ expression: relevantExprConverted }),
        ]
      }
    }

    return propsAdvanced
  }

  extractNodeDefSpecificProps(type, collectNodeDef) {
    switch (type) {
      case NodeDef.nodeDefType.code: {
        const listName = CollectSurvey.getAttribute('list')(collectNodeDef)
        const categoryName = R.includes(listName, CollectSurvey.samplingPointDataCodeListNames)
          ? Survey.samplingPointDataCategoryName
          : listName
        const category = Survey.getCategoryByName(categoryName)(this.survey)

        const layoutCollect = CollectSurvey.getUiAttribute('layoutType')(collectNodeDef)
        const renderType =
          layoutCollect === 'radio' ? NodeDefLayout.renderType.checkbox : NodeDefLayout.renderType.dropdown

        return {
          [NodeDef.propKeys.categoryUuid]: Category.getUuid(category),
          [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(Survey.cycleOneKey, renderType),
        }
      }
      case NodeDef.nodeDefType.entity: {
        const enumerate = CollectSurvey.getCollectAttribute('enumerate')(collectNodeDef)
        return enumerate ? { [NodeDef.propKeys.enumerate]: enumerate } : {}
      }
      case NodeDef.nodeDefType.file: {
        const collectMaxSize = CollectSurvey.getAttribute('maxSize')(collectNodeDef)
        // in Collect max size is in bytes; convert it into MB
        const maxSize = collectMaxSize ? Math.ceil(collectMaxSize / (1024 * 1024)) : null
        const collectFileType = CollectSurvey.getAttribute('n0:fileType', 'IMAGE')(collectNodeDef)
        const fileType = arenaFileTypeByCollectFileType[collectFileType]
        return {
          [NodeDef.propKeys.maxFileSize]: maxSize,
          [NodeDef.propKeys.fileType]: fileType,
        }
      }
      case NodeDef.nodeDefType.taxon: {
        const taxonomyName = CollectSurvey.getAttribute('taxonomy')(collectNodeDef)
        const taxonomy = Survey.getTaxonomyByName(taxonomyName)(this.survey)

        return {
          [NodeDef.propKeys.taxonomyUuid]: Taxonomy.getUuid(taxonomy),
        }
      }

      default:
        return {}
    }
  }

  async parseDefaultValues({ nodeDef, collectNodeDef }) {
    const { defaultLanguage } = this.context

    const collectDefaultValues = CollectSurvey.getElementsByName('default')(collectNodeDef)

    const { defaultValues, importIssues } = parseDefaultValues({
      survey: this.survey,
      nodeDef,
      collectDefaultValues,
      defaultLanguage,
    })

    this.importIssues.push(...importIssues)

    return defaultValues
  }

  parseValidationRules({ nodeDef, collectNodeDef }) {
    const { defaultLanguage } = this.context

    const collectValidationRules = CollectSurvey.getElements(collectNodeDef)

    const { validationRules, importIssues, unique } = parseValidationRules({
      survey: this.survey,
      nodeDef,
      collectValidationRules,
      defaultLanguage,
    })

    this.importIssues.push(...importIssues)

    return { validationRules, unique }
  }

  /**.
   * Adds a text attribute with name ${nodeDefName}_${qualifiableCode} (for each 'qualifiable' code list item in the list)
   *
   * @param parentNodeDef
   * @param nodeDef
   */
  async addSpecifyTextAttribute(parentNodeDef, nodeDef) {
    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(this.survey)
    const categoryName = Category.getName(category)
    const levelIndex = Survey.getNodeDefCategoryLevelIndex(nodeDef)(this.survey)

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
        [NodeDef.propKeys.name]: this.nodeDefUniqueNameGenerator.getUniqueNodeDefName({
          parentNodeDefName: NodeDef.getName(parentNodeDef),
          nodeDefName: `${nodeDefName}${specifyAttributeNameSuffix}`,
        }),
        [NodeDef.propKeys.labels]: R.pipe(
          NodeDef.getLabels,
          R.mapObjIndexed((label) => `${label}${specifyAttributeLabelSuffix}`)
        )(nodeDef),
        // hidden when not relevant
        [NodeDef.propKeys.layout]: {
          [Survey.cycleOneKey]: {
            [NodeDefLayout.keys.hiddenWhenNotRelevant]: true,
          },
        },
      }

      const applicableIfExpr = NodeDef.isSingle(nodeDef)
        ? `${nodeDefName} == "${itemCode}"`
        : `includes(${nodeDefName}, "${itemCode}")
        `

      const propsAdvanced = {
        [NodeDef.keysPropsAdvanced.applicable]: [NodeDefExpression.createExpression({ expression: applicableIfExpr })],
      }
      const qualifierNodeDefParam = _createNodeDef(parentNodeDef, NodeDef.nodeDefType.text, props, propsAdvanced)
      const qualifierNodeDefAndOthersUpdated = await NodeDefManager.insertNodeDef(
        {
          user: this.user,
          survey: this.survey,
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
      // starting from the node def parent path, find the path of the node referenced by collectCodeParentExpr
      // e.g. parentPath = /cluster/plot, collectCodeParentExpr = parent()/cluster_id, result is /cluster/cluster_id

      const collectNodeDefParentPathParts = parentPath.split('/')
      const codeParentExprParts = collectCodeParentExpr.split('/')

      // count the calls to parent() function
      const countOfParentCalls = codeParentExprParts.findIndex((part) => part !== 'parent()')

      // referenced node path will be the concatenation of:
      // - parentPath moved up "countOfParentCalls" levels
      // - last part of collectCodeParentExpr
      const referecedNodeDefPath = [
        ...collectNodeDefParentPathParts.slice(0, collectNodeDefParentPathParts.length - countOfParentCalls),
        ...codeParentExprParts.slice(countOfParentCalls),
      ].join('/')

      const nodeDefsInfo = this.nodeDefsInfoByCollectPath[referecedNodeDefPath]

      const success = Boolean(nodeDefsInfo)

      this.importIssues.push(
        CollectImportReportItem.newReportItem({
          nodeDefUuid: NodeDef.getUuid(nodeDef),
          expressionType: CollectImportReportItem.exprTypes.codeParent,
          expression: collectCodeParentExpr,
          resolved: success,
        })
      )

      return success ? R.propOr(null, 'uuid', R.head(nodeDefsInfo)) : null
    }

    return null
  }

  get survey() {
    const { survey } = this.context
    // dependency graph generation not necessary
    return Survey.assocNodeDefs({ nodeDefs: this.nodeDefs, updateDependencyGraph: false })(survey)
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
