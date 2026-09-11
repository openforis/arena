import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Category from '@core/survey/category'
import * as OdkImportReportItem from '@core/survey/odkImportReportItem'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
// Small, generic (no Collect-specific logic) name-deduplication utility - reused as-is rather than
// forked, see docs/superpowers/specs/2026-09-09-odk-import-design.md.
import NodeDefUniqueNameGenerator from '@server/modules/collectImport/service/collectImport/model/nodeDefUniqueNameGenerator'
import * as OdkImportReportManager from '../../../manager/odkImportReportManager'

import * as XForm from '../model/xform'
import type { XmlElement, XFormBind, XFormBodyControl, ItextTranslations } from '../model/xform'
import { mapXFormTypeToNodeDefType, arenaFileTypeFromMediatype } from '../model/xformTypeMapping'
import { OdkExpressionConverter } from './nodeDefsImportJob/odkExpressionConverter'

const literalTrueValues = ['true()', 'true']
const literalFalseValues = ['false()', 'false']

/**
 * Recursively walks the XForm primary instance (node shape) and, for each node, joins in the
 * matching <bind> (type, relevant/constraint/calculate/required expressions) and body control
 * (display/select items/upload mediatype) to create the matching Arena NodeDef. Repeats are detected
 * via the body <repeat> path set built during execute(). Mirrors collectImport's NodeDefsImportJob:
 * base NodeDef inserted first, then relevant/constraint/calculate/required are converted (via
 * OdkExpressionConverter) and applied as a second `updateNodeDefProps` call, same two-phase shape
 * Collect's importer uses. Every conversion attempt (success or failure) is logged as an
 * OdkImportReportItem and never blocks the import - see the design spec.
 *
 * Known limitation (shared with Collect's own importer, not a regression): expressions are converted
 * in the same single top-to-bottom pass nodes are inserted in, so a `relevant`/`constraint`/`calculate`
 * referencing a sibling that hasn't been inserted yet (appears later in the primary instance) will fail
 * to resolve and gets flagged rather than silently retried.
 */
export default class NodeDefsImportJob extends Job {
  static readonly type = 'NodeDefsImportJob'

  nodeDefs: Record<string, any>
  nodeDefsByXFormPath: Map<string, any>
  nodeDefUniqueNameGenerator: NodeDefUniqueNameGenerator
  reportItems: any[]
  entityUuidsWithKeyAssigned: Set<string>

  constructor(params?: any) {
    super(NodeDefsImportJob.type, params)
    this.nodeDefs = {}
    this.nodeDefsByXFormPath = new Map()
    this.nodeDefUniqueNameGenerator = new NodeDefUniqueNameGenerator()
    this.reportItems = []
    // Arena requires every entity (root and every multiple/repeatable entity) to have at least one key
    // attribute among its own direct children to ever be publishable, but ODK has no equivalent concept
    // in its bind/body model to read one from - defaulted to the first eligible (canNodeDefTypeBeKey)
    // attribute directly under each entity, in document order. Found this was a hard requirement (not
    // just a nice-to-have) by actually trying to publish an ODK-imported survey through the real UI -
    // without it, publishing always fails, which blocks every data-import source (not just ODK's),
    // since Authorizer.canImportRecords requires a published survey.
    this.entityUuidsWithKeyAssigned = new Set()
  }

  async execute() {
    const context: any = this.context
    const { xform, surveyId } = context

    const bindsByPath = XForm.buildBindsByPath(xform)
    const repeatPaths = XForm.buildRepeatPathsSet(xform)
    const bodyControlsByPath = XForm.buildBodyControlsByPath(xform)
    const { translations } = XForm.getItextTranslations(xform)

    this.setContext({ bindsByPath, repeatPaths, bodyControlsByPath, itextTranslations: translations })

    const primaryInstanceRoot = XForm.getPrimaryInstanceRoot(xform)

    this._calculateTotal(primaryInstanceRoot)

    await this._insertNodeDef({ parentNodeDef: null, parentPath: null, instanceElement: primaryInstanceRoot })

    // Every entity (not just root) that ended up with no eligible key candidate among its children -
    // e.g. one whose only attributes are file/geo/coordinate/boolean types - is flagged for manual
    // review, since it will block publishing otherwise.
    for (const entityNodeDef of Object.values(this.nodeDefs)) {
      if (!NodeDef.isEntity(entityNodeDef)) continue
      const entityUuid = NodeDef.getUuid(entityNodeDef)
      if (this.entityUuidsWithKeyAssigned.has(entityUuid)) continue
      this._pushReportItem({
        nodeDefUuid: entityUuid,
        itemType: OdkImportReportItem.itemTypes.missingEntityKey,
        message: "No eligible attribute found for this entity's key; set one manually before publishing.",
      })
    }

    await OdkImportReportManager.insertItems({ surveyId, items: this.reportItems }, this.tx)

    // Persisted so a later data-import run (a separate job, possibly a separate session entirely) can
    // resolve an ODK submission's element paths to Arena NodeDefs without re-deriving names, which the
    // NodeDefUniqueNameGenerator may have changed from the raw XForm element name (dedup/keyword clash).
    const pathToNodeDefUuid: Record<string, string> = {}
    this.nodeDefsByXFormPath.forEach((nodeDef, path) => {
      pathToNodeDefUuid[path] = NodeDef.getUuid(nodeDef)
    })
    await SurveyManager.updateSurveyProp(
      this.user,
      surveyId,
      Survey.infoKeys.odkNodeDefsInfoByPath,
      pathToNodeDefUuid,
      true,
      this.tx
    )

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle: Survey.cycleOneKey, draft: true, advanced: true },
      this.tx
    )

    this.setContext({ [Job.keysContext.survey]: survey })
  }

  async _insertNodeDef({
    parentNodeDef,
    parentPath,
    instanceElement,
  }: {
    parentNodeDef: any
    parentPath: string | null
    instanceElement: XmlElement
  }): Promise<any> {
    const context: any = this.context
    const { defaultLanguage, bindsByPath, repeatPaths, bodyControlsByPath, itextTranslations, categoriesByKey } =
      context as {
        defaultLanguage: string
        bindsByPath: Map<string, XFormBind>
        repeatPaths: Set<string>
        bodyControlsByPath: Map<string, XFormBodyControl>
        itextTranslations: ItextTranslations
        categoriesByKey: Record<string, any>
      }

    const nodeName = XForm.xmlLocalName(instanceElement.name)

    // Reserved ODK/OpenRosa bookkeeping node (instanceID etc.) - not user data, same skip rule as
    // XForm.visitPrimaryInstanceNodes (used here for totals only, not for driving this insert walk,
    // since inserts need to happen in parent-before-child order interleaved with awaited DB calls).
    if (nodeName === 'meta' && parentNodeDef !== null) return null

    const path = parentPath ? `${parentPath}/${nodeName}` : `/${nodeName}`

    const bind = bindsByPath.get(path) ?? null
    const bodyControl = bodyControlsByPath.get(path) ?? null
    const childElements = XForm.getChildElements(instanceElement)
    const isEntity = childElements.length > 0 || parentNodeDef === null

    const labels = XForm.resolveLabels({
      labelRef: bodyControl?.labelRef ?? null,
      labelText: bodyControl?.labelText ?? null,
      translations: itextTranslations,
      defaultLanguage,
    })

    if (!isEntity) {
      return this._insertAttributeNodeDef({ parentNodeDef, path, nodeName, bind, bodyControl, labels, categoriesByKey })
    }

    const multiple = parentNodeDef !== null && repeatPaths.has(path)
    const pageUuid = multiple ? null : uuidv4()

    const props: Record<string, any> = {
      [NodeDef.propKeys.name]: this.nodeDefUniqueNameGenerator.getUniqueNodeDefName({
        parentNodeDefName: NodeDef.getName(parentNodeDef),
        nodeDefName: nodeName,
      }),
      [NodeDef.propKeys.multiple]: multiple,
      [NodeDef.propKeys.key]: false,
      [NodeDef.propKeys.labels]: labels,
      [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(Survey.cycleOneKey, NodeDefLayout.renderType.form, pageUuid),
    }

    const nodeDefParam = NodeDef.newNodeDef(parentNodeDef, NodeDef.nodeDefType.entity, [Survey.cycleOneKey], props)
    const nodeDefsUpdated = await NodeDefManager.insertNodeDef(
      { user: this.user, survey: this.survey, nodeDef: nodeDefParam, system: true },
      this.tx
    )
    Object.assign(this.nodeDefs, nodeDefsUpdated)
    this.incrementProcessedItems()

    let nodeDef = nodeDefsUpdated[NodeDef.getUuid(nodeDefParam)]
    this.nodeDefsByXFormPath.set(path, nodeDef)

    // entities only ever carry a `relevant` bind in practice (constraint/calculate/required are
    // attribute-only concepts) - still routed through the same helper for consistency
    nodeDef = await this._applyExpressions({ nodeDef, path, bind })

    for (const childElement of childElements) {
      if (this.isCanceled()) break
      await this._insertNodeDef({ parentNodeDef: nodeDef, parentPath: path, instanceElement: childElement })
    }

    return nodeDef
  }

  async _insertAttributeNodeDef({
    parentNodeDef,
    path,
    nodeName,
    bind,
    bodyControl,
    labels,
    categoriesByKey,
  }: {
    parentNodeDef: any
    path: string
    nodeName: string
    bind: XFormBind | null
    bodyControl: XFormBodyControl | null
    labels: Record<string, string>
    categoriesByKey: Record<string, any>
  }): Promise<any> {
    const odkType = bind?.type ?? null
    const mapping = mapXFormTypeToNodeDefType({
      odkType,
      readonly: bind?.readonly ?? null,
      hasCalculate: Boolean(bind?.calculate),
    })

    // The report table's node_def_uuid FK requires a *real, already-inserted* NodeDef - a mapping
    // issue discovered before insert (including "skip", where no NodeDef is ever created for this
    // path at all) is attached to the parent entity instead, which always exists by this point.
    if (mapping.flag) {
      this._pushReportItem({
        nodeDefUuid: NodeDef.getUuid(parentNodeDef),
        itemType: mapping.flag,
        expression: odkType,
        message: path,
      })
    }
    if (mapping.skip || !mapping.nodeDefType) {
      this.incrementProcessedItems()
      return null
    }

    const type = mapping.nodeDefType

    // First eligible attribute directly under each entity becomes that entity's key - see the
    // constructor comment for why this default exists at all.
    const parentUuid = NodeDef.getUuid(parentNodeDef)
    const isKey =
      !this.entityUuidsWithKeyAssigned.has(parentUuid) && !bind?.calculate && NodeDef.canNodeDefTypeBeKey(type)
    if (isKey) this.entityUuidsWithKeyAssigned.add(parentUuid)

    const props: Record<string, any> = {
      [NodeDef.propKeys.name]: this.nodeDefUniqueNameGenerator.getUniqueNodeDefName({
        parentNodeDefName: NodeDef.getName(parentNodeDef),
        nodeDefName: nodeName,
      }),
      [NodeDef.propKeys.multiple]: false,
      [NodeDef.propKeys.key]: isKey,
      [NodeDef.propKeys.labels]: labels,
    }

    // a calculated attribute isn't meant to be user-edited directly, same convention as Collect's
    // importer (which marks its own "calculated" attributes read-only)
    if (bind?.calculate) {
      props[NodeDef.propKeys.readOnly] = true
    }

    let categoryMissing = false
    if (type === NodeDef.nodeDefType.code) {
      const categoryKey = bodyControl?.itemsetInstanceId ? `instance:${bodyControl.itemsetInstanceId}` : `field:${path}`
      const category = categoriesByKey?.[categoryKey]
      if (category) {
        props[NodeDef.propKeys.categoryUuid] = Category.getUuid(category)
      } else {
        categoryMissing = true
      }
      if (odkType === 'select') {
        props[NodeDef.propKeys.multiple] = true
      }
    }

    if (type === NodeDef.nodeDefType.file) {
      props[NodeDef.propKeys.fileType] = arenaFileTypeFromMediatype(bodyControl?.mediatype ?? null)
    }

    const nodeDefParam = NodeDef.newNodeDef(parentNodeDef, type, [Survey.cycleOneKey], props)
    const nodeDefsUpdated = await NodeDefManager.insertNodeDef(
      { user: this.user, survey: this.survey, nodeDef: nodeDefParam, system: true },
      this.tx
    )
    Object.assign(this.nodeDefs, nodeDefsUpdated)
    this.incrementProcessedItems()

    let nodeDef = nodeDefsUpdated[NodeDef.getUuid(nodeDefParam)]
    this.nodeDefsByXFormPath.set(path, nodeDef)

    // logged only now that the attribute's own uuid exists, to satisfy the report table's FK
    if (categoryMissing) {
      this._pushReportItem({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        itemType: OdkImportReportItem.itemTypes.missingCategory,
        message: path,
      })
    } else if (type === NodeDef.nodeDefType.code && bodyControl?.hasChoiceFilter) {
      this._pushReportItem({
        nodeDefUuid: NodeDef.getUuid(nodeDef),
        itemType: OdkImportReportItem.itemTypes.choiceFilterNotConverted,
        message: path,
      })
    }

    nodeDef = await this._applyExpressions({ nodeDef, path, bind })

    return nodeDef
  }

  /**
   * Converts bind.relevant/constraint/calculate/required (if present) and, for whichever convert
   * successfully, updates the just-inserted NodeDef's advanced props in a second call - same
   * insert-then-update-advanced-props shape as collectImport's NodeDefsImportJob. Every attempt
   * (success or failure) is logged as an OdkImportReportItem regardless.
   */
  async _applyExpressions({
    nodeDef,
    path,
    bind,
  }: {
    nodeDef: any
    path: string
    bind: XFormBind | null
  }): Promise<any> {
    if (!bind) return nodeDef

    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const survey = this.survey
    const propsAdvanced: Record<string, any> = {}
    const validations: Record<string, any> = {}

    const convertAndReport = async ({ itemType, expression }: { itemType: string; expression: string }) => {
      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent: nodeDef,
        currentXFormPath: path,
        nodeDefsByXFormPath: this.nodeDefsByXFormPath,
        expression,
      })
      this._pushReportItem({ nodeDefUuid, itemType, expression, resolved: Boolean(converted) })
      return converted
    }

    if (bind.relevant) {
      const converted = await convertAndReport({
        itemType: OdkImportReportItem.itemTypes.relevant,
        expression: bind.relevant,
      })
      if (converted) {
        propsAdvanced[NodeDef.keysPropsAdvanced.applicable] = [
          NodeDefExpression.createExpression({ expression: converted }),
        ]
      }
    }

    if (bind.constraint) {
      const converted = await convertAndReport({
        itemType: OdkImportReportItem.itemTypes.constraint,
        expression: bind.constraint,
      })
      if (converted) {
        validations[NodeDefValidations.keys.expressions] = [
          NodeDefExpression.createExpression({ expression: converted }),
        ]
      }
    }

    if (bind.calculate) {
      const converted = await convertAndReport({
        itemType: OdkImportReportItem.itemTypes.calculate,
        expression: bind.calculate,
      })
      if (converted) {
        propsAdvanced[NodeDef.keysPropsAdvanced.defaultValues] = [
          NodeDefExpression.createExpression({ expression: converted }),
        ]
      }
    }

    if (bind.required) {
      const requiredRaw = bind.required.trim()
      if (literalTrueValues.includes(requiredRaw)) {
        validations[NodeDefValidations.keys.required] = true
      } else if (!literalFalseValues.includes(requiredRaw)) {
        // a non-trivial `required` expression - Arena's required flag is a plain boolean (unlike
        // relevant/constraint/calculate, it has no expression slot to convert into), so this is
        // flagged for manual review rather than guessed at
        this._pushReportItem({
          nodeDefUuid,
          itemType: OdkImportReportItem.itemTypes.requiredExpr,
          expression: bind.required,
          resolved: false,
        })
      }
    }

    if (Object.keys(validations).length > 0) {
      propsAdvanced[NodeDef.keysPropsAdvanced.validations] = validations
    }

    if (Object.keys(propsAdvanced).length === 0) return nodeDef

    const nodeDefsUpdated = await NodeDefManager.updateNodeDefProps(
      {
        user: this.user,
        survey: this.survey,
        nodeDefUuid,
        parentUuid: NodeDef.getParentUuid(nodeDef),
        props: {},
        propsAdvanced,
        system: true,
      },
      this.tx
    )
    Object.assign(this.nodeDefs, nodeDefsUpdated)
    const updatedNodeDef = nodeDefsUpdated[nodeDefUuid]
    this.nodeDefsByXFormPath.set(path, updatedNodeDef)
    return updatedNodeDef
  }

  _pushReportItem({
    nodeDefUuid,
    itemType,
    expression = null,
    message = null,
    resolved = false,
  }: {
    nodeDefUuid: string
    itemType: string
    expression?: string | null
    message?: string | null
    resolved?: boolean
  }) {
    this.reportItems.push(
      OdkImportReportItem.newReportItem({
        nodeDefUuid,
        itemType,
        expression,
        message,
        resolved,
      })
    )
  }

  _calculateTotal(primaryInstanceRoot: XmlElement) {
    let count = 0
    XForm.visitPrimaryInstanceNodes(primaryInstanceRoot, () => {
      count += 1
    })
    this.total = count
  }

  get survey() {
    const context: any = this.context
    // dependency graph generation not necessary here, same as collectImport's NodeDefsImportJob
    return Survey.assocNodeDefsSimple({ nodeDefs: this.nodeDefs })(context.survey)
  }
}
