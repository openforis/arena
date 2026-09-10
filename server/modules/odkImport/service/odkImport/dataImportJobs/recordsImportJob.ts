import { ConflictResolutionStrategy } from '@common/dataImport'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as SurveyFile from '@core/survey/surveyFile'

import Job from '@server/job/job'
import BatchPersister from '@server/db/batchPersister'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import { insertFile } from '@server/modules/survey/manager/surveyFileManager'
import { CategoryItemProviderDefault } from '@server/modules/category/manager/categoryItemProviderDefault'
import { findExistingRecordSummary } from '@server/modules/dataImport/service/DataImportJob/recordImportMatcher'

import * as XForm from '../model/xform'
import type { XmlElement } from '../model/xform'
import { extractAttributeValue } from './odkAttributeValueExtractor'

const categoryItemProvider = CategoryItemProviderDefault

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Extracts ODK's <meta><instanceID> value (conventionally "uuid:<uuid>", sometimes the bare uuid) as a
 * validated, lowercased uuid, or null if absent/not actually uuid-shaped.
 */
const extractInstanceUuid = (submissionRoot: XmlElement): string | null => {
  const metaEl = XForm.getChildElements(submissionRoot).find((el) => XForm.xmlLocalName(el.name) === 'meta')
  const instanceIdEl =
    metaEl && XForm.getChildElements(metaEl).find((el) => XForm.xmlLocalName(el.name) === 'instanceID')
  const raw = instanceIdEl ? XForm.getElementText(instanceIdEl) : null
  if (!raw) return null
  const stripped = raw.startsWith('uuid:') ? raw.slice(5) : raw
  return UUID_PATTERN.test(stripped) ? stripped.toLowerCase() : null
}

const groupChildrenByName = (elements: XmlElement[]): Map<string, XmlElement[]> => {
  const groups = new Map<string, XmlElement[]>()
  elements.forEach((element) => {
    const name = XForm.xmlLocalName(element.name)
    const existing = groups.get(name)
    if (existing) {
      existing.push(element)
    } else {
      groups.set(name, [element])
    }
  })
  return groups
}

/**
 * Imports every submission in an ODK Briefcase-style export zip (opened by OdkSubmissionReaderJob)
 * into Arena records, one per submission. Submission element names mirror the XForm primary instance
 * 1:1 (no foreign-name translation table needed, unlike Collect), so paths are resolved directly
 * through the `odkNodeDefsInfoByPath` survey prop NodeDefsImportJob persisted at schema-import time.
 *
 * v1 conflict policy (deliberately simple - see the Phase 2 plan doc): primarily by uuid - ODK's own
 * <meta><instanceID> is reused directly as the Arena record's uuid (stable and globally unique per
 * submission), so re-importing the same submission always collides on uuid and is skipped, with no
 * dependency on the schema having a key attribute (a freshly ODK-imported schema won't have one - see
 * NodeDefsImportJob). `findExistingRecordSummary`'s key-based matching (via the 'merge' strategy,
 * purely to trigger it) is kept as a secondary check for submissions with no parseable instanceID.
 * Every match is treated as skip, never as an actual overwrite/merge - those aren't implemented yet,
 * so no existing data is ever at risk of being silently altered.
 */
export default class RecordsImportJob extends Job {
  static readonly type = 'RecordsImportJob'

  batchPersister: BatchPersister
  submittedCount: number
  skippedCount: number

  constructor(params?: any) {
    super(RecordsImportJob.type, params)
    this.batchPersister = new BatchPersister(this.nodesBatchInsertHandler.bind(this), 2500)
    this.submittedCount = 0
    this.skippedCount = 0
  }

  async execute() {
    const { surveyId, user, tx } = this
    const context: any = this.context
    const { submissionFileZip, submissionEntryNames, cycle = Survey.cycleOneKey } = context

    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfoSummary = Survey.getSurveyInfo(surveySummary)
    const fetchDraft =
      (Survey.isFromCollect(surveyInfoSummary) || Survey.isFromOdk(surveyInfoSummary)) &&
      !Survey.isPublished(surveyInfoSummary)

    const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, cycle, draft: fetchDraft, advanced: true },
      tx
    )
    const surveyInfo = Survey.getSurveyInfo(survey)
    const nodeDefsInfoByPath = Survey.getOdkNodeDefsInfoByPath(surveyInfo) as { [path: string]: string }

    const { list: existingRecordsSummary } = await RecordManager.fetchRecordsSummaryBySurveyId(
      { surveyId, cycle, includeRootKeyValues: true },
      tx
    )

    this.total = submissionEntryNames.length

    for (const entryName of submissionEntryNames) {
      if (this.isCanceled()) break

      const submissionXml = submissionFileZip.getEntryAsText(entryName)
      const submissionDir = entryName.slice(0, entryName.length - '/submission.xml'.length)
      const submissionRoot = XForm.parseXForm(submissionXml)

      // ODK's own <meta><instanceID> is a stable, globally-unique identifier per submission - reused
      // directly as the Arena record's uuid so re-importing the same submission collides on uuid and
      // is skipped, regardless of whether the schema has any attribute marked as a key (most freshly
      // ODK-imported schemas won't - see the Phase 2 plan doc).
      const instanceUuid = extractInstanceUuid(submissionRoot)
      if (instanceUuid && existingRecordsSummary.some((summary: any) => Record.getUuid(summary) === instanceUuid)) {
        this.skippedCount += 1
        this.incrementProcessedItems()
        continue
      }

      const recordToCreate = { ...Record.newRecord(user, cycle), ...(instanceUuid ? { uuid: instanceUuid } : {}) }
      let record = await RecordManager.insertRecord(user, surveyId, recordToCreate, true, tx)

      const rootNodeDefUuid = nodeDefsInfoByPath[`/${XForm.xmlLocalName(submissionRoot.name)}`]
      if (!rootNodeDefUuid) {
        this.logWarn(`root node def not found for submission ${entryName}; skipping`)
        this.incrementProcessedItems()
        continue
      }
      const rootNode = Node.newNode(rootNodeDefUuid, Record.getUuid(record), null)
      record = Record.assocNode(rootNode, { sideEffect: true })(record)

      record = await this._buildRecordNodes({
        survey,
        nodeDefsInfoByPath,
        parentNode: rootNode,
        parentPath: `/${XForm.xmlLocalName(submissionRoot.name)}`,
        submissionElement: submissionRoot,
        record,
        submissionFileZip,
        submissionDir,
      })

      const existingMatch = findExistingRecordSummary({
        survey,
        record,
        existingRecordsSummary,
        conflictResolutionStrategy: ConflictResolutionStrategy.merge, // triggers key-based matching only
      })

      if (existingMatch) {
        this.skippedCount += 1
        this.incrementProcessedItems()
        continue
      }

      await this._insertRecordNodes(record)
      this.submittedCount += 1
      this.incrementProcessedItems()
    }

    this.setContext({ submittedCount: this.submittedCount, skippedCount: this.skippedCount })
  }

  async beforeSuccess() {
    await this.batchPersister.flush(this.tx)
    const context: any = this.context
    context.submissionFileZip?.close()
  }

  async _buildRecordNodes({
    survey,
    nodeDefsInfoByPath,
    parentNode,
    parentPath,
    submissionElement,
    record,
    submissionFileZip,
    submissionDir,
  }: {
    survey: any
    nodeDefsInfoByPath: { [path: string]: string }
    parentNode: any
    parentPath: string
    submissionElement: XmlElement
    record: any
    submissionFileZip: any
    submissionDir: string
  }): Promise<any> {
    let recordUpdated = record
    const childrenByName = groupChildrenByName(XForm.getChildElements(submissionElement))

    for (const [childName, childElements] of childrenByName) {
      if (childName === 'meta') continue

      const childPath = `${parentPath}/${childName}`
      const nodeDefUuid = nodeDefsInfoByPath[childPath]
      if (!nodeDefUuid) continue // field not present in the current schema - skip, don't guess

      const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      if (!nodeDef) continue

      for (const childElement of childElements) {
        if (this.isCanceled()) break

        if (NodeDef.isEntity(nodeDef)) {
          const node = Node.newNode(nodeDefUuid, Record.getUuid(recordUpdated), parentNode)
          recordUpdated = Record.assocNode(node, { sideEffect: true })(recordUpdated)

          recordUpdated = await this._buildRecordNodes({
            survey,
            nodeDefsInfoByPath,
            parentNode: node,
            parentPath: childPath,
            submissionElement: childElement,
            record: recordUpdated,
            submissionFileZip,
            submissionDir,
          })
        } else {
          const rawText = XForm.getElementText(childElement)

          recordUpdated = await this._buildAttributeNodes({
            survey,
            nodeDef,
            nodeDefUuid,
            parentNode,
            rawText,
            record: recordUpdated,
            submissionFileZip,
            submissionDir,
          })
        }
      }
    }
    return recordUpdated
  }

  async _buildAttributeNodes({
    survey,
    nodeDef,
    nodeDefUuid,
    parentNode,
    rawText,
    record,
    submissionFileZip,
    submissionDir,
  }: {
    survey: any
    nodeDef: any
    nodeDefUuid: string
    parentNode: any
    rawText: string | null
    record: any
    submissionFileZip: any
    submissionDir: string
  }): Promise<any> {
    if (NodeDef.getType(nodeDef) === NodeDef.nodeDefType.file) {
      return this._buildFileNode({
        nodeDefUuid,
        parentNode,
        fileName: rawText,
        record,
        submissionFileZip,
        submissionDir,
      })
    }

    const value = await extractAttributeValue({ survey, nodeDef, categoryItemProvider, rawText, tx: this.tx })
    if (value === null) return record

    let recordUpdated = record
    const values = NodeDef.isMultiple(nodeDef) && Array.isArray(value) ? value : [value]
    for (const singleValue of values) {
      const node = Node.newNode(nodeDefUuid, Record.getUuid(recordUpdated), parentNode, singleValue)
      recordUpdated = Record.assocNode(node, { sideEffect: true })(recordUpdated)
    }
    return recordUpdated
  }

  async _buildFileNode({
    nodeDefUuid,
    parentNode,
    fileName,
    record,
    submissionFileZip,
    submissionDir,
  }: {
    nodeDefUuid: string
    parentNode: any
    fileName: string | null
    record: any
    submissionFileZip: any
    submissionDir: string
  }): Promise<any> {
    if (!fileName) return record

    const entryPath = `${submissionDir}/${fileName}`
    const content = submissionFileZip.getEntryData(entryPath)
    if (!content) {
      this.logWarn(`media file not found in zip: ${entryPath}`)
      return record
    }

    const node = Node.newNode(nodeDefUuid, Record.getUuid(record), parentNode)
    const fileSize = Buffer.byteLength(content)
    const file = SurveyFile.createFile({
      name: fileName,
      size: fileSize,
      content,
      recordUuid: Node.getRecordUuid(node),
      nodeUuid: Node.getUuid(node),
      type: SurveyFile.SurveyFileType.recordAttachment,
    })
    await insertFile(this.surveyId, file, this.tx)

    const nodeWithValue = Node.assocValue({
      [Node.valuePropsFile.fileUuid]: SurveyFile.getUuid(file),
      [Node.valuePropsFile.fileName]: fileName,
      [Node.valuePropsFile.fileSize]: fileSize,
    })(node)
    return Record.assocNode(nodeWithValue, { sideEffect: true })(record)
  }

  async _insertRecordNodes(record: any) {
    for (const node of Record.getNodesArray(record)) {
      await this.batchPersister.addItem(node, this.tx)
    }
  }

  async nodesBatchInsertHandler(nodesArray: any[], tx: any) {
    await RecordManager.insertNodesInBulk(
      { user: this.user, surveyId: this.surveyId, nodesArray, systemActivity: true },
      tx
    )
  }
}
