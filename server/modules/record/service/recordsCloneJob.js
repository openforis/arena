import { Objects, Promises } from '@openforis/arena-core'

import * as A from '@core/arena'
import { uuidv4 } from '@core/uuid'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as RecordValidation from '@core/record/recordValidation'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'

export default class RecordsCloneJob extends Job {
  constructor(params) {
    super(RecordsCloneJob.type, params)
  }

  async execute() {
    const { context } = this
    const { surveyId, cycleFrom, cycleTo } = context

    const { nodeDefKeys: nodeDefKeysCycleFrom, list: recordsCycleFrom } =
      await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId, cycle: cycleFrom })
    const { nodeDefKeys: nodeDefKeysCycleTo, list: recordsCycleTo } = await RecordManager.fetchRecordsSummaryBySurveyId(
      { surveyId, cycle: cycleTo }
    )

    if (!Objects.isEqual(nodeDefKeysCycleFrom, nodeDefKeysCycleTo)) {
      return
    }

    const keys = nodeDefKeysCycleFrom.map((nodeDefKey) => A.camelize(NodeDef.getName(nodeDefKey)))
    const getKeyValues = (recordSummary) => keys.map((key) => recordSummary[key])

    const recordsToClone = recordsCycleFrom.filter((recordCycleFrom) => {
      const keyValuesRecordCycleFrom = getKeyValues(recordCycleFrom)
      return !recordsCycleTo.some((recordCycleTo) =>
        Objects.isEqual(keyValuesRecordCycleFrom, getKeyValues(recordCycleTo))
      )
    })

    this.total = recordsToClone.length

    await Promises.each(recordsToClone, async (recordSummary) => this.cloneRecord(recordSummary))
  }

  async cloneRecord(recordSummary) {
    const { surveyId, context } = this
    const { cycleTo } = context

    const record = await RecordManager.fetchRecordAndNodesByUuid({
      surveyId,
      recordUuid: recordSummary.uuid,
      fetchForUpdate: false,
    })
    record.uuid = uuidv4()
    record.cycle = cycleTo
    delete record.id

    const newUuidsByOldUuid = this.assignNewUuidsToNodes(record)

    // update validation
    this.assignNewUuidsToValidation({ record, newUuidsByOldUuid })

    return true
  }

  assignNewUuidsToValidation({ record, newUuidsByOldUuid }) {
    Object.entries(record.validation?.fields || {}).forEach(([oldFieldKey, validationField]) => {
      let newFieldKey
      if (oldFieldKey.startsWith(RecordValidation.prefixValidationFieldChildrenCount)) {
        const oldParentUuid = oldFieldKey.substring(
          RecordValidation.prefixValidationFieldChildrenCount,
          oldFieldKey.lastIndexOf('_')
        )
        const newParentUuid = newUuidsByOldUuid[oldParentUuid]
        newFieldKey = oldFieldKey.replace(oldParentUuid, newParentUuid)
      } else {
        newFieldKey = newUuidsByOldUuid[oldFieldKey]
      }
      record.validation.fields[newFieldKey] = validationField
      delete record.validation.fields[oldFieldKey]
    })
  }

  assignNewUuidsToNodes(record) {
    // generate a new uuid for each node
    const newUuidsByOldUuid = {}

    const nodes = Record.getNodesArray(record)

    nodes.forEach((node) => {
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
    nodes.forEach((node) => {
      node.parentUuid = newUuidsByOldUuid[node.parentUuid]

      node.hierarchy?.each((ancestorUuid, index) => {
        node.hierarchy[index] = newUuidsByOldUuid[ancestorUuid]
      })
    })

    return newUuidsByOldUuid
  }
}

RecordsCloneJob.type = 'RecordsCloneJob'
