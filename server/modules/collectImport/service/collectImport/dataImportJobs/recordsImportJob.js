import * as R from 'ramda'

import BatchPersister from '@server/db/batchPersister'

import * as FileXml from '@server/utils/file/fileXml'
import Queue from '@core/queue'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordExpressionParser from '@core/record/recordExpressionParser'

import SystemError from '@core/systemError'

import Job from '@server/job/job'
import * as SurveyManager from '../../../../survey/manager/surveyManager'
import * as RecordManager from '../../../../record/manager/recordManager'

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

    const { deleteAllRecords, collectSurvey, cycle = Survey.cycleOneKey } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: true, advanced: true },
      tx
    )
    const surveyInfo = Survey.getSurveyInfo(survey)

    // check survey URI
    const collectSurveyUri = CollectSurvey.getUri(collectSurvey)
    if (Survey.getCollectUri(surveyInfo) !== collectSurveyUri) {
      throw new SystemError('importingDataIntoWrongCollectSurvey', { collectSurveyUri })
    }

    if (deleteAllRecords) {
      this.logDebug('deleting all records before import')
      await RecordManager.deleteRecordsBySurvey({ surveyId }, this.tx)
    }

    const entryNames = this.getEntryNames()

    this.total = entryNames.length

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
      const record = await RecordManager.insertRecord(user, surveyId, recordToCreate, true, tx)
      // This.logDebug(`${entryName} recordToCreate end`)

      // this.logDebug(`${entryName} traverseCollectRecordAndInsertNodes start`)
      await this.traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson)
      // This.logDebug(`${entryName} traverseCollectRecordAndInsertNodes end`)

      // this.logDebug(`-- end import record ${entryName}`)

      this.incrementProcessedItems()
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

  async traverseCollectRecordAndInsertNodes(survey, record, collectRecordJson) {
    const { collectSurveyFileZip, collectSurvey } = this.context

    const surveyInfo = Survey.getSurveyInfo(survey)
    const nodeDefsInfoByCollectPath = Survey.getCollectNodeDefsInfoByPath(surveyInfo)

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

      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefPath]

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

        await this._insertNode(nodeDef, nodeToInsert)
        recordUpdated = Record.assocNode(nodeToInsert)(recordUpdated)

        if (NodeDef.isEntity(nodeDef)) {
          // Create child nodes to insert
          const { nodesToInsert } = this._createNodeChildrenToInsert(
            survey,
            collectNodeDef,
            collectNodeDefPath,
            collectNode,
            nodeToInsert
          )
          queue.enqueueItems(nodesToInsert)
        }
      }
    }

    await this._updateRelevance(survey, recordUpdated)
  }

  _createNodeChildrenToInsert(survey, collectNodeDef, collectNodeDefPath, collectNode, node) {
    const surveyInfo = Survey.getSurveyInfo(survey)
    const nodeDefsInfoByCollectPath = Survey.getCollectNodeDefsInfoByPath(surveyInfo)

    // Output
    const nodesToInsert = []

    const collectNodeDefChildren = CollectSurvey.getNodeDefChildren(collectNodeDef)
    for (const collectNodeDefChild of collectNodeDefChildren) {
      if (this.isCanceled()) {
        break
      }

      const collectNodeDefChildName = CollectSurvey.getAttributeName(collectNodeDefChild)
      const collectNodeDefChildPath = collectNodeDefPath + '/' + collectNodeDefChildName
      const nodeDefsInfo = nodeDefsInfoByCollectPath[collectNodeDefChildPath]

      if (nodeDefsInfo) {
        const collectChildNodes = CollectRecord.getNodeChildren([collectNodeDefChildName])(collectNode)

        const childrenCount = collectChildNodes.length

        // If children count > 0
        for (const collectChildNode of collectChildNodes) {
          if (this.isCanceled()) {
            break
          }

          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: collectChildNode,
          })
        }

        // Get nodeDefUuid from first nodeDef field
        const { uuid: nodeDefChildUuid } = nodeDefsInfo[0]
        const nodeDefChild = Survey.getNodeDefByUuid(nodeDefChildUuid)(survey)

        if (NodeDef.isSingle(nodeDefChild) && childrenCount === 0) {
          nodesToInsert.push({
            nodeParent: node,
            collectNodeDef: collectNodeDefChild,
            collectNodeDefPath: collectNodeDefChildPath,
            collectNode: {},
          })
        }
      } else {
        this.logError(`==== NodeDef not found for ${collectNodeDefChildPath}`)
      }
    }

    return {
      nodesToInsert,
    }
  }

  async _insertNode(nodeDef, node) {
    node.dateCreated = new Date()
    const value = Node.getValue(node, null)

    const nodeValueInsert = [
      Node.getUuid(node),
      node.dateCreated,
      node.dateCreated,
      Node.getRecordUuid(node),
      Node.getParentUuid(node),
      NodeDef.getUuid(nodeDef),
      JSON.stringify(value),
      {
        ...Node.getMeta(node),
        [Node.metaKeys.childApplicability]: {},
      },
    ]

    await this.batchPersister.addItem(nodeValueInsert, this.tx)
  }

  /**
   * Evaluates all record entities children applicability and stores the updated nodes.
   *
   * @param {!Survey} survey
   * @param {!Record} record
   * @returns {Promise<null>} - The result promise.
   */
  async _updateRelevance(survey, record) {
    await this.batchPersister.flush(this.tx)

    const stack = []
    stack.push(Record.getRootNode(record))

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
              record,
              node,
              expressionsApplicable
            )
            applicable = R.propOr(false, 'value', exprEval)
          }
          const childDefUuid = NodeDef.getUuid(childDef)
          childrenApplicability[childDefUuid] = applicable

          if (applicable) {
            const nodeChildren = Record.getNodeChildrenByDefUuid(node, childDefUuid)(record)
            stack.push(...nodeChildren)
          }
        })
        const nodeUpdated = Node.mergeMeta({ [Node.metaKeys.childApplicability]: childrenApplicability })(node)
        await RecordManager.updateNode(this.user, survey, record, nodeUpdated, true, this.tx)
      }
    }
  }

  async nodesBatchInsertHandler(nodeValues, tx) {
    await RecordManager.insertNodesFromValues(this.user, this.surveyId, nodeValues, tx)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
