import { Objects, Promises, SystemError } from '@openforis/arena-core'

import * as A from '@core/arena'
import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'
import * as DateUtils from '@core/dateUtils'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as DataTableUpdateRepository from '@server/modules/surveyRdb/repository/dataTableUpdateRepository'

import { NodesInsertBatchPersister } from '../manager/NodesInsertBatchPersister'

export default class RecordsCloneJob extends Job {
  constructor(params) {
    super(RecordsCloneJob.type, params)
  }

  async onStart() {
    await super.onStart()

    const { context, user, tx } = this
    const { surveyId } = context
    this.nodesInsertBatchPersister = new NodesInsertBatchPersister({ user, surveyId, tx })
  }

  async execute() {
    const recordsToClone = await this.findRecordsToClone()

    this.total = recordsToClone.length

    await Promises.each(recordsToClone, async (recordSummary) => this.cloneRecord({ recordSummary }))
  }

  async beforeSuccess() {
    await super.beforeSuccess()
    await this.nodesInsertBatchPersister.flush()
  }

  async findRecordsToClone() {
    const { context } = this
    const { surveyId, cycleFrom, cycleTo, recordsUuids } = context

    const { nodeDefKeys: nodeDefKeysCycleFrom, list: recordsCycleFrom } =
      await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle: cycleFrom })
    const { nodeDefKeys: nodeDefKeysCycleTo, list: recordsCycleTo } = await RecordManager.fetchRecordsSummaryBySurveyId(
      { surveyId, cycle: cycleTo }
    )

    if (!Objects.isEqual(nodeDefKeysCycleFrom, nodeDefKeysCycleTo)) {
      throw new SystemError('validationErrors.recordClone.differentKeyAttributes')
    }

    const keys = nodeDefKeysCycleFrom.map((nodeDefKey) => A.camelize(NodeDef.getName(nodeDefKey)))
    const getKeyValues = (recordSummary) => keys.map((key) => recordSummary[key])

    const recordsToClone = recordsCycleFrom.filter((recordCycleFrom) => {
      if (!Objects.isEmpty(recordsUuids) && !recordsUuids.includes(Record.getUuid(recordCycleFrom))) {
        return false
      }
      const keyValuesRecordCycleFrom = getKeyValues(recordCycleFrom)
      return !recordsCycleTo.some((recordCycleTo) =>
        Objects.isEqual(keyValuesRecordCycleFrom, getKeyValues(recordCycleTo))
      )
    })
    return recordsToClone
  }

  async cloneRecord({ recordSummary }) {
    const { context, tx, user } = this
    const { surveyId, cycleTo } = context

    const record = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId,
      recordUuid: recordSummary.uuid,
      fetchForUpdate: false,
    })
    record.uuid = uuidv4()
    record.dateCreated = DateUtils.formatDateTimeISO(new Date())
    record.cycle = cycleTo
    delete record.id

    // assign new uuids to nodes
    const { newUuidsByOldUuid, nodesArray } = this.assignNewUuidsToNodes(record)

    // assign new uuids to validation
    this.assignNewUuidsToValidation({ record, newUuidsByOldUuid })

    // insert record
    await RecordManager.insertRecord(user, surveyId, record, true, tx)

    // insert nodes (add them to batch persister)
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId }, tx)

    await Promises.each(nodesArray, async (node) => {
      // check that the node definition associated to the node has not been deleted from the survey
      if (Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)) {
        await this.nodesInsertBatchPersister.addItem(node)
      }
    })

    // update RDB
    await DataTableUpdateRepository.updateTables({ survey, record, nodes: Record.getNodes(record) }, tx)

    this.incrementProcessedItems()
  }

  assignNewUuidsToValidation({ record, newUuidsByOldUuid }) {
    if (!record.validation?.fields) return

    Object.entries(record.validation.fields).forEach(([oldFieldKey, validationField]) => {
      let newFieldKey
      if (oldFieldKey.startsWith(RecordValidation.prefixValidationFieldChildrenCount)) {
        const oldParentUuid = oldFieldKey.substring(
          RecordValidation.prefixValidationFieldChildrenCount.length,
          oldFieldKey.lastIndexOf('_')
        )
        const newParentUuid = newUuidsByOldUuid[oldParentUuid]
        newFieldKey = oldFieldKey.replace(oldParentUuid, newParentUuid)
      } else {
        newFieldKey = newUuidsByOldUuid[oldFieldKey]
      }
      if (newFieldKey) {
        record.validation.fields[newFieldKey] = validationField
      }
      delete record.validation.fields[oldFieldKey]
    })
  }

  assignNewUuidsToNodes(record) {
    // generate a new uuid for each node
    const newUuidsByOldUuid = {}

    // sort nodes before removing the id, to preserve their hierarchy (faster than comparing each meta.h property)
    const nodesArray = Record.getNodesArray(record).sort((nodeA, nodeB) => nodeA.id - nodeB.id)

    nodesArray.forEach((node) => {
      node.recordUuid = record.uuid
      node.dateCreated = node.dateModified = DateUtils.formatDateTimeISO(new Date())

      const oldUuid = Node.getUuid(node)
      const newUuid = uuidv4()
      newUuidsByOldUuid[oldUuid] = newUuid

      node.uuid = newUuid
      // consider every node as just created node
      delete node.id
      node.created = true // this flag will be used by the RDB generator)

      delete record.nodes[oldUuid]
      record.nodes[newUuid] = node
    })

    // update internal node uuids
    nodesArray.forEach((node) => {
      node.parentUuid = newUuidsByOldUuid[node.parentUuid]

      node.hierarchy?.each((ancestorUuid, index) => {
        node.hierarchy[index] = newUuidsByOldUuid[ancestorUuid]
      })
    })

    return { newUuidsByOldUuid, nodesArray }
  }
}

RecordsCloneJob.type = 'RecordsCloneJob'
