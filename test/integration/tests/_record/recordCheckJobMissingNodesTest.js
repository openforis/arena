import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import RecordCheckJob from '@server/modules/survey/service/recordCheckJob'

import * as SB from '../../../utils/surveyBuilder'

const entityName = 'root_entity'
const plainAttrName = 'some_value'
const computedAttrName = 'computed_value'
const computedDefaultValue = 'computed default'

// Simulates the record shape produced by a Collect data import: the record row and only the nodes
// that have a matching path in the Collect data get created (see RecordsImportJob.
// traverseCollectRecordAndInsertNodes), bypassing the normal node-creation machinery
// (NodeCreationManager.insertNode / RecordNodesUpdater.createDescendants) that would otherwise also
// create every other single-cardinality attribute of the entity - including computedAttrName here -
// and apply its default value.
const _insertRecordMissingComputedNode = async ({ user, survey, keyValue }) => {
  const surveyId = Survey.getId(survey)
  const rootDef = Survey.getNodeDefRoot(survey)
  const plainAttrDef = Survey.getNodeDefByName(plainAttrName)(survey)

  const recordToCreate = Record.newRecord(user, Survey.cycleOneKey)
  const recordDb = await RecordManager.insertRecord(user, surveyId, recordToCreate, true)
  const recordUuid = Record.getUuid(recordDb)

  const rootNode = Node.newNode(NodeDef.getUuid(rootDef), recordUuid)
  const plainAttrNode = Node.newNode(NodeDef.getUuid(plainAttrDef), recordUuid, rootNode, keyValue)

  await RecordManager.insertNodesInBulk({ user, surveyId, nodesArray: [rootNode, plainAttrNode] })

  return recordUuid
}

const _buildSurvey = ({ user }) =>
  SB.survey(
    user,
    SB.entity(
      entityName,
      SB.attribute(plainAttrName, NodeDef.nodeDefType.integer).key(),
      SB.attribute(computedAttrName, NodeDef.nodeDefType.text)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression({ expression: `'${computedDefaultValue}'` }))
    )
  ).buildAndStore()

const _fetchComputedNodes = async ({ survey, recordUuid }) => {
  const surveyId = Survey.getId(survey)
  const computedAttrDef = Survey.getNodeDefByName(computedAttrName)(survey)

  const record = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid,
    includeSurveyUuid: false,
    includeRecordUuid: false,
  })
  const rootNode = Record.getRootNode(record)
  return Record.getNodeChildrenByDefUuid(rootNode, NodeDef.getUuid(computedAttrDef))(record)
}

export const recordCheckJobInsertsMissingNodesWithDefaultValuesTest = async ({ user }) => {
  const survey = await _buildSurvey({ user })
  const surveyId = Survey.getId(survey)

  const recordCheckedUuid = await _insertRecordMissingComputedNode({ user, survey, keyValue: 1 })
  const recordNotCheckedUuid = await _insertRecordMissingComputedNode({ user, survey, keyValue: 2 })

  // Sanity check: the computed node is indeed missing right after the simulated import.
  const computedNodesBeforeCheck = await _fetchComputedNodes({ survey, recordUuid: recordCheckedUuid })
  expect(computedNodesBeforeCheck).toHaveLength(0)

  // Only recordCheckedUuid is passed to the job, mirroring how a Collect data import would scope the
  // check to the records it just inserted rather than the whole survey.
  const checkJob = new RecordCheckJob({ user, surveyId, recordUuids: [recordCheckedUuid] })
  await checkJob.start()

  if (checkJob.isFailed()) {
    throw new Error(`RecordCheckJob failed: ${JSON.stringify(checkJob.errors)}`)
  }

  const computedNodesChecked = await _fetchComputedNodes({ survey, recordUuid: recordCheckedUuid })
  expect(computedNodesChecked).toHaveLength(1)
  expect(Node.getValue(computedNodesChecked[0])).toBe(computedDefaultValue)

  // Records outside the given recordUuids scope must be left untouched.
  const computedNodesNotChecked = await _fetchComputedNodes({ survey, recordUuid: recordNotCheckedUuid })
  expect(computedNodesNotChecked).toHaveLength(0)
}

// Regression test for a Collect import that inserted zero records (e.g. an empty step/entry list): an
// explicitly empty recordUuids array must be treated as "check nothing", not as "no restriction" -
// RecordManager.fetchRecordsUuidAndCycle's recordUuidsIncluded filter is skipped for an empty array
// (see Objects.isEmpty in @openforis/arena-core), so without RecordCheckJob's own early-return guard
// this would silently scan and recompute default values for every record in the survey instead.
export const recordCheckJobWithEmptyRecordUuidsIsNoOpTest = async ({ user }) => {
  const survey = await _buildSurvey({ user })
  const surveyId = Survey.getId(survey)

  const recordUuid = await _insertRecordMissingComputedNode({ user, survey, keyValue: 1 })

  const checkJob = new RecordCheckJob({ user, surveyId, recordUuids: [] })
  await checkJob.start()

  if (checkJob.isFailed()) {
    throw new Error(`RecordCheckJob failed: ${JSON.stringify(checkJob.errors)}`)
  }

  const computedNodes = await _fetchComputedNodes({ survey, recordUuid })
  expect(computedNodes).toHaveLength(0)
}
