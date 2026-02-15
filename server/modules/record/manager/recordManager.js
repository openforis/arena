import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'
import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as User from '@core/user/user'
import * as ObjectUtils from '@core/objectUtils'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as RecordRepository from '../repository/recordRepository'
import * as FileRepository from '../repository/fileRepository'
import * as NodeRepository from '../repository/nodeRepository'
import * as RecordUpdateManager from './_recordManager/recordUpdateManager'
import { NodeRdbManager } from './_recordManager/nodeRDBManager'

// ==== CREATE

export { insertRecord, createRecordFromSamplingPointDataItem } from './_recordManager/recordCreationManager'
export { insertNodesInBatch, insertNodesInBulk } from './_recordManager/nodeCreationManager'

export const { insertNode } = RecordUpdateManager
export const { generateRdbUpates, persistNodesToRDB } = NodeRdbManager

// ==== READ

export const fetchRecordsSummaryBySurveyId = async (
  {
    surveyId,
    offset,
    limit,
    sortBy,
    sortOrder,
    cycle: cycleParam = null,
    search = null,
    step = null,
    recordUuid = null,
    ownerUuid = null,
    includeRootKeyValues = true,
    includePreview = false,
    includeCounts = false,
  },
  client = db
) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = includeRootKeyValues
    ? await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
    : null

  let nodeDefKeys = null
  let summaryDefs = null
  let survey = null
  if (includeRootKeyValues) {
    // when fetching summary defs, use the cycle param if provided, otherwise use the survey default cycle
    const cycle = cycleParam ?? Survey.getDefaultCycleKey(surveyInfo)
    survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: nodeDefsDraft }, client)
    summaryDefs = Survey.getRootSummaryDefs({ cycle })(survey)
    nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  }

  const list = await RecordRepository.fetchRecordsSummaryBySurveyId(
    {
      surveyId,
      cycle: cycleParam,
      nodeDefRoot,
      nodeDefKeys,
      summaryDefs,
      offset,
      limit,
      sortBy,
      sortOrder,
      search,
      step,
      ownerUuid,
      recordUuids: recordUuid ? [recordUuid] : null,
      includePreview,
    },
    client
  )

  if (!includeCounts) {
    return {
      nodeDefKeys,
      list,
    }
  }

  const nodeDefFiles = survey ? Survey.getNodeDefsArray(survey).filter(NodeDef.isFile) : []
  const nodeDefFileUuids = nodeDefFiles.map(NodeDef.getUuid)

  const listWithCounts = []
  for (const recordSummary of list) {
    const recordUuid = Record.getUuid(recordSummary)
    const { count: filesCount, total: filesSize } = await FileRepository.fetchCountAndTotalFilesSize(
      { surveyId, recordUuid },
      client
    )
    const filesMissing = R.isEmpty(nodeDefFileUuids)
      ? 0
      : await NodeRepository.countNodesWithMissingFile({ surveyId, recordUuid, nodeDefFileUuids }, client)

    listWithCounts.push({
      ...recordSummary,
      filesCount,
      filesSize,
      filesMissing,
    })
  }
  return {
    nodeDefKeys,
    list: listWithCounts,
  }
}

export const fetchRecordSummary = async (
  { surveyId, recordUuid, includeRootKeyValues = true, includePreview = false },
  client = db
) => {
  const { list } = await fetchRecordsSummaryBySurveyId(
    { surveyId, recordUuid, includeRootKeyValues, includePreview },
    client
  )
  return list[0]
}

export const countRecordsBySurveyId = async ({ surveyId, cycle: cycleParam, search, ownerUuid }, client = db) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById({ surveyId, draft: true }, client)
  const nodeDefsDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

  const nodeDefRoot = await NodeDefRepository.fetchRootNodeDef(surveyId, nodeDefsDraft, client)
  const cycle = cycleParam ?? Survey.getDefaultCycleKey(surveyInfo)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, draft: nodeDefsDraft }, client)
  const nodeDefKeys = Survey.getNodeDefRootKeys(survey)
  const summaryDefs = Survey.getRootSummaryDefs({ cycle })(survey)

  return RecordRepository.countRecordsBySurveyId(
    { surveyId, cycle, search, nodeDefKeys, summaryDefs, nodeDefRoot, ownerUuid },
    client
  )
}

export {
  countRecordsBySurveyIdGroupedByStep,
  fetchRecordByUuid,
  fetchRecordsByUuids,
  fetchRecordsUuidAndCycle,
  fetchRecordCreatedCountsByDates,
  fetchRecordCreatedCountsByDatesAndUser,
  fetchRecordCreatedCountsByUser,
  fetchRecordCountsByStep,
  insertRecordsInBatch,
  updateRecordDateModifiedFromValues,
  updateRecordMergedInto,
} from '../repository/recordRepository'

const _fetchAndSetRecordOwner = async ({ ownerUuid, record }, client = db) => {
  const owner = await UserManager.fetchUserByUuid(ownerUuid, client)
  record[Record.keys.ownerName] = User.getName(owner)
  record[Record.keys.ownerEmail] = User.getEmail(owner)
  const surveyUuid = Record.getSurveyUuid(record)
  const ownerAuthGroup = User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(owner)
  record[Record.keys.ownerRole] = AuthGroup.getName(ownerAuthGroup)
}

export const fetchRecordAndNodesByUuid = async (
  {
    surveyId,
    recordUuid,
    draft = false,
    fetchForUpdate = true,
    includeRefData = true,
    includeSurveyUuid = true,
    includeRecordUuid = true,
  },
  client = db
) => {
  const record = await RecordRepository.fetchRecordByUuid(surveyId, recordUuid, client)
  if (!record) return null

  const ownerUuid = Record.getOwnerUuid(record)
  if (ownerUuid) {
    await _fetchAndSetRecordOwner({ ownerUuid, record }, client)
  }
  const nodes = await NodeRepository.fetchNodesByRecordUuid(
    {
      surveyId,
      recordUuid,
      includeRefData: fetchForUpdate || includeRefData,
      includeSurveyUuid,
      includeRecordUuid,
      draft,
    },
    client
  )
  const indexedNodes = ObjectUtils.toUuidIndexedObj(nodes)
  return Record.assocNodes({ nodes: indexedNodes, updateNodesIndex: fetchForUpdate, sideEffect: true })(record)
}

export { fetchNodeByIId as fetchNodeByUuid, fetchChildNodesByNodeDefUuids } from '../repository/nodeRepository'

const fetchNodeRefData = async ({ survey, node, isCode }, client) => {
  const surveyId = Survey.getId(survey)
  if (isCode) {
    const categoryItemUuid = Node.getCategoryItemUuid(node)
    const categoryItem = await CategoryRepository.fetchItemByUuid({ surveyId, uuid: categoryItemUuid }, client)
    if (!categoryItem) {
      return null
    }
    return { [NodeRefData.keys.categoryItem]: categoryItem }
  } else {
    const taxonUuid = Node.getTaxonUuid(node)
    const taxon = await TaxonomyRepository.fetchTaxonByUuid(surveyId, taxonUuid, false, client)
    if (!taxon) {
      return null
    }
    const vernacularNameUuid = Node.getVernacularNameUuid(node)
    const vernacularName = vernacularNameUuid
      ? await TaxonomyRepository.fetchTaxonVernacularNameByUuid(surveyId, vernacularNameUuid, false, client)
      : null
    if (vernacularName) {
      taxon[Taxon.keys.vernacularNameUuid] = vernacularNameUuid
      taxon[Taxon.keys.vernacularName] = TaxonVernacularName.getName(vernacularName)
      taxon[Taxon.keys.vernacularLanguage] = TaxonVernacularName.getLang(vernacularName)
    }
    return { [NodeRefData.keys.taxon]: taxon }
  }
}

export const assocRefDataToNodes = async ({ survey, nodes, onlyForBigCategoriesTaxonomies = true }, client = db) => {
  for (const node of nodes) {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    const isCode = NodeDef.isCode(nodeDef)
    const isTaxon = NodeDef.isTaxon(nodeDef)
    if ((isCode || isTaxon) && !Node.isValueBlank(node)) {
      const categoryUuid = NodeDef.getCategoryUuid(nodeDef)
      const category = categoryUuid ? Survey.getCategoryByUuid(categoryUuid)(survey) : null
      const taxonomyUuid = NodeDef.getTaxonomyUuid(nodeDef)
      const taxonomy = taxonomyUuid ? Survey.getTaxonomyByUuid(taxonomyUuid)(survey) : null
      if (
        !onlyForBigCategoriesTaxonomies ||
        (isCode && Category.isBigCategory(category)) ||
        (isTaxon && Taxonomy.isBigTaxonomy(taxonomy))
      ) {
        const refData = await fetchNodeRefData({ survey, node, isCode }, client)
        if (refData) {
          node[NodeRefData.keys.refData] = refData
        }
      }
    }
  }
  return nodes
}

// ==== UPDATE

export {
  initNewRecord,
  updateRecordStepInTransaction,
  persistNode,
  updateNode,
  updateNodesDependents,
} from './_recordManager/recordUpdateManager'

export const updateRecordsStep = async ({ user, surveyId, cycle, stepFrom, stepTo, recordUuids }, client = db) =>
  client.tx(async (t) => {
    const recordsSummaryToMove = await RecordRepository.fetchRecordsSummaryBySurveyId(
      {
        surveyId,
        cycle,
        step: stepFrom,
        recordUuids,
      },
      client
    )
    await Promise.all(
      recordsSummaryToMove.map((record) =>
        RecordUpdateManager.updateRecordStep({ user, surveyId, record, stepId: stepTo }, t)
      )
    )
    return { count: recordsSummaryToMove.length }
  })

export const updateNodes = async ({ user, surveyId, nodes }, client = db) =>
  client.tx(async (t) => {
    const activities = nodes.map((node) => {
      const logContent = R.pick([
        Node.keys.uuid,
        Node.keys.recordUuid,
        Node.keys.parentUuid,
        Node.keys.nodeDefUuid,
        Node.keys.meta,
        Node.keys.value,
      ])(node)
      return ActivityLog.newActivity(ActivityLog.type.nodeValueUpdate, logContent, true)
    })
    await ActivityLogRepository.insertMany(user, surveyId, activities, t)
    await NodeRepository.updateNodes({ surveyId, nodes }, t)
  })

export { updateRecordDateModified, updateRecordsOwner } from '../repository/recordRepository'

export const updateRecordOwner = async ({ user, surveyId, recordUuid, ownerUuid }, client = db) =>
  client.tx(async (t) => {
    const logContent = { recordUuid, ownerUuid }
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.recordOwnerUpdate, logContent, false, t)
    await RecordRepository.updateRecordOwner({ surveyId, recordUuid, ownerUuid }, t)
  })

// ==== DELETE

export {
  deleteRecord,
  deleteRecordPreview,
  deleteRecordsPreview,
  deleteRecordsByCycles,
  deleteNode,
  deleteNodesByNodeDefUuids,
  deleteNodesByInternalIds,
} from './_recordManager/recordUpdateManager'

// ==== VALIDATION
export {
  persistValidation,
  mergeAndPersistValidation,
  updateRecordValidationsFromValues,
  validateNodesAndPersistValidation,
  validateSortedNodesAndPersistValidation,
} from './_recordManager/recordValidationManager'

export {
  getValidationReportAsStream,
  fetchValidationReport,
  countValidationReportItems,
} from './_recordManager/validationReportManager'
