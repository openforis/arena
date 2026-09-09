import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Category from '@core/survey/category'

import Job from '@server/job/job'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
// Small, generic (no Collect-specific logic) name-deduplication utility - reused as-is rather than
// forked, see docs/superpowers/specs/2026-09-09-odk-import-design.md.
import NodeDefUniqueNameGenerator from '@server/modules/collectImport/service/collectImport/model/nodeDefUniqueNameGenerator'

import * as XForm from '../model/xform'
import type { XmlElement, XFormBind, XFormBodyControl, ItextTranslations } from '../model/xform'
import { mapXFormTypeToNodeDefType, arenaFileTypeFromMediatype } from '../model/xformTypeMapping'

export interface OdkImportIssue {
  path: string
  flag: string
}

/**
 * Recursively walks the XForm primary instance (node shape) and, for each node, joins in the
 * matching <bind> (type/validation - validation/expressions deferred to a later phase, see the
 * design spec) and body control (display/select items/upload mediatype) to create the matching
 * Arena NodeDef. Repeats are detected via the body <repeat> path set built by OdkFormReaderJob's
 * caller (see execute()). Mirrors collectImport's NodeDefsImportJob, without the expression-
 * conversion and validation-parsing steps (phase 0 scope only).
 */
export default class NodeDefsImportJob extends Job {
  static readonly type = 'NodeDefsImportJob'

  nodeDefs: Record<string, any>
  nodeDefUniqueNameGenerator: NodeDefUniqueNameGenerator
  importIssues: OdkImportIssue[]

  constructor(params?: any) {
    super(NodeDefsImportJob.type, params)
    this.nodeDefs = {}
    this.nodeDefUniqueNameGenerator = new NodeDefUniqueNameGenerator()
    this.importIssues = []
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

    this.importIssues.forEach((issue) => this.logWarn(`ODK import: ${issue.flag} at ${issue.path}`))

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle: Survey.cycleOneKey, draft: true, advanced: true },
      this.tx
    )

    this.setContext({ importIssues: this.importIssues, [Job.keysContext.survey]: survey })
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

    const nodeDef = nodeDefsUpdated[NodeDef.getUuid(nodeDefParam)]

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
      hasBodyControl: Boolean(bodyControl),
    })

    if (mapping.flag) {
      this.importIssues.push({ path, flag: mapping.flag })
    }
    if (mapping.skip || !mapping.nodeDefType) {
      this.incrementProcessedItems()
      return null
    }

    const type = mapping.nodeDefType

    const props: Record<string, any> = {
      [NodeDef.propKeys.name]: this.nodeDefUniqueNameGenerator.getUniqueNodeDefName({
        parentNodeDefName: NodeDef.getName(parentNodeDef),
        nodeDefName: nodeName,
      }),
      [NodeDef.propKeys.multiple]: false,
      [NodeDef.propKeys.key]: false,
      [NodeDef.propKeys.labels]: labels,
    }

    if (type === NodeDef.nodeDefType.code) {
      const categoryKey = bodyControl?.itemsetInstanceId ? `instance:${bodyControl.itemsetInstanceId}` : `field:${path}`
      const category = categoriesByKey?.[categoryKey]
      if (category) {
        props[NodeDef.propKeys.categoryUuid] = Category.getUuid(category)
      } else {
        this.importIssues.push({ path, flag: 'missingCategory' })
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

    return nodeDefsUpdated[NodeDef.getUuid(nodeDefParam)]
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
