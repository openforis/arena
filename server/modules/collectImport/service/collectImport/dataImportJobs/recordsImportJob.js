import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as PromiseUtils from '@core/promiseUtils'
import Queue from '@core/queue'
import SystemError from '@core/systemError'

import BatchPersister from '@server/db/batchPersister'
import * as FileXml from '@server/utils/file/fileXml'
import Job from '@server/job/job'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordManager from '../../../../record/manager/recordManager'
import * as ActivityLogManager from '../../../../activityLog/manager/activityLogManager'

import * as CollectRecord from '../model/collectRecord'
import * as CollectSurvey from '../model/collectSurvey'
import * as CollectAttributeValueExtractor from './collectAttributeValueExtractor'

export default class RecordsImportJob extends Job {
  constructor(params) {
    super(RecordsImportJob.type, params)

    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
  }

  async onStart() {
    await super.onStart()

    // Speed up processing a bit:
    await this.tx.query('SET CONSTRAINTS ALL DEFERRED')
  }

  async execute() {
    const { surveyId, user, tx } = this

    const { deleteAllRecords, collectSurvey, cycle = Survey.cycleOneKey, forceImport = false } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: true, advanced: true },
      tx
    )
    const surveyInfo = Survey.getSurveyInfo(survey)

    if (!forceImport) {
      // check survey URI
      const collectSurveyUri = CollectSurvey.getUri(collectSurvey)
      if (Survey.getCollectUri(surveyInfo) !== collectSurveyUri) {
        throw new SystemError('importingDataIntoWrongCollectSurvey', { collectSurveyUri })
      }
    }

    if (deleteAllRecords) {
      this.logDebug('deleting all records before import')
      await RecordManager.deleteRecordsByCycles(surveyId, [cycle], this.tx)
    }

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

    const nodeDefNamesByPath = CollectSurvey.generateArenaNodeDefNamesByPath(collectSurvey)

    for (const entryName of entryNames) {
      if (this.isCanceled()) {
        break
      }

      // This.logDebug(`-- start import record ${entryName}`)

      // this.logDebug(`${entryName} findCollectRecordData start`)
      const collectRecordData = this.findCollectRecordData(entryName)
      const { collectRecordXml, step } = collectRecordData
      // This.logDebug(`${entryName} findCollectRecordData done`)

      // this.logDebug(`${entryName} parseToJson start`)
      const collectRecordJson = FileXml.parseToJson(collectRecordXml)
      // This.logDebug(`${entryName} parseToJson done`)

      // this.logDebug(`${entryName} recordToCreate start`)
      const recordToCreate = Record.newRecord(user, cycle, false, CollectRecord.getDateCreated(collectRecordJson), step)

      await ActivityLogManager.insert(
        user,
        surveyId,
        ActivityLog.type.recordImportFromCollect,
        { recordUuid: Record.getUuid(recordToCreate) },
        false,
        tx
      )

      const record = await RecordManager.insertRecord(user, surveyId, recordToCreate, true, tx)
      // This.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes start`)
      await this.traverseCollectRecordAndInsertNodes({ survey, record, collectRecordJson, nodeDefNamesByPath })
      // This.logDebug(`${entryName} traverseCollectRecordAndInsertNodes end`)

      // this.logDebug(`-- end import record ${entryName}`)

      if (!this.isCanceled()) {
        this.incrementProcessedItems()
      }
    }

    this.setContext({ insertedRecords: this.processed })
  }

  async beforeSuccess() {
    await this.batchPersister.flush(this.tx)
  }

  getEntriesPath({ step }) {
    const { collectSurvey } = this.context
    return CollectSurvey.isCollectEarthSurvey(collectSurvey) ? `${step}/` : `data/${step}/`
  }

  getEntryNames() {
    const { collectSurveyFileZip } = this.context

    const steps = [1, 2, 3]

    for (const step of steps) {
      const entryNames = collectSurveyFileZip.getEntryNames(this.getEntriesPath({ step }))
      if (!R.isEmpty(entryNames)) {
        return entryNames
      }
    }

    return []
  }

  findCollectRecordData(entryName) {
    const { collectSurveyFileZip } = this.context

    const steps = [3, 2, 1]

    for (const step of steps) {
      const entryPath = `${this.getEntriesPath({ step })}${entryName}`
      const collectRecordXml = collectSurveyFileZip.getEntryAsText(entryPath)
      if (collectRecordXml) {
        return { collectRecordXml, step }
      }
    }

    throw new SystemError('entryDataNotFound', { entryName })
  }

  async traverseCollectRecordAndInsertNodes({ survey, record, collectRecordJson, nodeDefNamesByPath }) {
    const { collectSurveyFileZip, collectSurvey } = this.context

    const recordUuid = Record.getUuid(record)
    let recordUpdated = { ...record }

    const collectRootEntityName = CollectRecord.getRootEntityName(collectRecordJson)
    const collectRootEntityDefPath = `/${collectRootEntityName}`
    const collectRootEntityDef = CollectSurvey.getNodeDefByPath(collectRootEntityDefPath)(collectSurvey)
    const collectRootEntity = CollectRecord.getRootEntity(collectRecordJson, collectRootEntityName)

    const queue = new Queue([
      {
        nodeParent: null,
        collectNodeDef: collectRootEntityDef,
        collectNodeDefPath: collectRootEntityDefPath,
        collectNode: collectRootEntity,
      },
    ])

    while (!queue.isEmpty()) {
      const item = queue.dequeue()
      const { nodeParent, collectNodeDef, collectNodeDefPath, collectNode } = item

      let nodeDefsInfo = this._extractNodeDefInfoByCollectPath({ survey, nodeDefNamesByPath, collectNodeDefPath })

      if (!nodeDefsInfo) {
        this.logInfo(`could not find the node def in the path "${collectNodeDefPath}"; skipping it`)
      } else {
        for (const { uuid: nodeDefUuid, field } of nodeDefsInfo) {
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
          if (!nodeDef) {
            this.logInfo(`could not find the node def in the path "${collectNodeDefPath}"; skipping it`)
            continue
          }

          let nodeToInsert = Node.newNode(nodeDefUuid, recordUuid, nodeParent)

          const valueAndMeta = NodeDef.isAttribute(nodeDef)
            ? await CollectAttributeValueExtractor.extractAttributeValueAndMeta({
                survey,
                nodeDef,
                record: recordUpdated,
                node: nodeToInsert,
                collectSurveyFileZip,
                collectNodeDef,
                collectNode,
                collectNodeField: field,
                tx: this.tx,
              })
            : {}

          const { value = null, meta = {} } = valueAndMeta || {}

          nodeToInsert = R.pipe(Node.assocValue(value), Node.mergeMeta(meta))(nodeToInsert)

          recordUpdated = Record.assocNode(nodeToInsert, { sideEffect: true })(recordUpdated)

          if (NodeDef.isEntity(nodeDef)) {
            // Create child items to insert
            const { itemsToInsert } = this._extractChildrenItemsToInsert({
              survey,
              nodeDefNamesByPath,
              collectNodeDef,
              collectNodeDefPath,
              collectNode,
              node: nodeToInsert,
            })
            queue.enqueueItems(itemsToInsert)
          }
        }
      }
    }
    recordUpdated = this._updateRelevance(survey, recordUpdated)

    await this._insertRecordNodes(recordUpdated)
  }

  _extractNodeDefInfoByCollectPath({ survey, nodeDefNamesByPath, collectNodeDefPath }) {
    const surveyInfo = Survey.getSurveyInfo(survey)
    const nodeDefsInfoByCollectPath = Survey.getCollectNodeDefsInfoByPath(surveyInfo)

    let nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefPath]
    if (nodeDefsInfo) return nodeDefsInfo

    const nodeDefName = nodeDefNamesByPath[collectNodeDefPath]
    const nodeDef = nodeDefName ? Survey.getNodeDefByName(nodeDefName)(survey) : null
    return nodeDef ? [{ uuid: nodeDef.uuid }] : null
  }

  _extractChildrenItemsToInsert({ survey, nodeDefNamesByPath, collectNodeDef, collectNodeDefPath, collectNode, node }) {
    // Output
    const itemsToInsert = []

    const collectNodeDefChildren = CollectSurvey.getNodeDefChildren(collectNodeDef)
    collectNodeDefChildren.some((collectNodeDefChild) => {
      if (this.isCanceled()) {
        return true //breaks the loop
      }

      const collectNodeDefChildName = CollectSurvey.getAttributeName(collectNodeDefChild)
      const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
      const nodeDefsInfo = this._extractNodeDefInfoByCollectPath({
        survey,
        nodeDefNamesByPath,
        collectNodeDefPath: collectNodeDefChildPath,
      })

      if (nodeDefsInfo) {
        const collectChildNodes = CollectRecord.getNodeChildren([collectNodeDefChildName])(collectNode)

        const childrenCount = collectChildNodes.length

        // If children count > 0
        collectChildNodes.some((collectChildNode) => {
          if (this.isCanceled()) {
            return true //breaks the loop
          }

          itemsToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: collectChildNode,
          })
        })

        // Get nodeDefUuid from first nodeDef field
        const { uuid: nodeDefChildUuid } = nodeDefsInfo[0]
        const nodeDefChild = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

        if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
          itemsToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: {},
          })
        }
      } else {
        this.logError(`==== NodeDef not found for ${collectNodeDefChildPath}`)
      }
    })

    return {
      itemsToInsert,
    }
  }

  async _insertRecordNodes(record) {
    await PromiseUtils.each(Object.values(Record.getNodes(record)), async (node) =>
      this.batchPersister.addItem(node, this.tx)
    )
  }

  /**
   * Evaluates all record entities children applicability and stores the updated nodes.
   *
   * @param {!Survey} survey
   * @param {!Record} record
   * @returns {Promise<null>} - The result promise.
   */
  _updateRelevance(survey, record) {
    const stack = []
    stack.push(Record.getRootNode(record))
    let recordUpdated = record

    while (stack.length > 0) {
      const node = stack.pop()
      const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
      if (NodeDef.isEntity(nodeDef)) {
        const childrenApplicability = {}
        const nodeDefChildren = Survey.getNodeDefChildren(nodeDef)(survey)
        nodeDefChildren.forEach((childDef) => {
          let applicable = true
          const expressionsApplicable = NodeDef.getApplicable(childDef)

          if (!R.isEmpty(expressionsApplicable)) {
            const exprEval = RecordExpressionParser.evalApplicableExpression(
              survey,
              recordUpdated,
              node,
              expressionsApplicable
            )
            applicable = R.propOr(false, 'value', exprEval)
          }
          const childDefUuid = NodeDef.getUuid(childDef)

          if (applicable) {
            const nodeChildren = Record.getNodeChildrenByDefUuid(node, childDefUuid)(record)
            stack.push(...nodeChildren)
          } else {
            // store children applicability only if not applicable (applicable by default)
            childrenApplicability[childDefUuid] = applicable
          }
        })
        if (!R.isEmpty(childrenApplicability)) {
          const nodeUpdated = Node.mergeMeta({ [Node.metaKeys.childApplicability]: childrenApplicability })(node)
          recordUpdated = Record.assocNode(nodeUpdated, { sideEffect: true })(recordUpdated)
        }
      }
    }
    return recordUpdated
  }

  async nodesBatchInsertHandler(nodes, tx) {
    await RecordManager.insertNodesInBulk({ user: this.user, surveyId: this.surveyId, nodes, systemActivity: true }, tx)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
