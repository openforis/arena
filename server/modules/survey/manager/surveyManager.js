import pgPromise from 'pg-promise'
import * as R from 'ramda'

import { Numbers, Objects } from '@openforis/arena-core'
import { DBMigrator } from '@openforis/arena-server'

import * as ActivityLog from '@common/activityLog/activityLog'

import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as User from '@core/user/user'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'
import SystemError from '@core/systemError'

import { db } from '@server/db/db'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as NodeRepository from '@server/modules/record/repository/nodeRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as FileManager from '@server/modules/record/manager/fileManager'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'
import * as SrsRepository from '@server/modules/geo/repository/srsRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as SurveyRepositoryUtils from '../repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../repository/surveyRepository'

const assocSurveyInfo = (survey) => survey

const _fetchAndAssocSrss = async ({ surveyInfo }, client) => {
  const srsCodes = Survey.getSRSCodes(surveyInfo)
  if (srsCodes.length === 0) return surveyInfo

  const srss = await SrsRepository.fetchSRSsByCodes({ srsCodes }, client)
  return Survey.assocSrs(srss)(surveyInfo)
}

const _fetchAndAssocRdbInitialized = async ({ surveyInfo }, client) => {
  const surveyId = Survey.getId(surveyInfo)
  const rdbInitialized = await SchemaRdbRepository.selectSchemaExists(surveyId, client)
  return Survey.assocRDBInitilized(rdbInitialized)(surveyInfo)
}

const _fetchAndAssocAdditionalInfo = async ({ surveyInfo }, client) => {
  let surveyInfoUpdated = await _fetchAndAssocSrss({ surveyInfo }, client)
  return _fetchAndAssocRdbInitialized({ surveyInfo: surveyInfoUpdated }, client)
}

// ====== VALIDATION

export const validateNewSurvey = async ({ newSurvey }) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name) // TODO add object model for newSurvey
  return SurveyValidator.validateNewSurvey({ newSurvey, surveyInfos })
}

export const validateSurveyClone = async ({ newSurvey }) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name)
  return SurveyValidator.validateSurveyClone({ newSurvey, surveyInfos })
}

export const validateSurveyImportFromCollect = async ({ newSurvey }) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name)
  return SurveyValidator.validateSurveyImportFromCollect({ newSurvey, surveyInfos })
}

const validateSurveyInfo = async (surveyInfo) =>
  SurveyValidator.validateSurveyInfo(surveyInfo, await SurveyRepository.fetchSurveysByName(Survey.getName(surveyInfo)))

// ====== CREATE

const _addUserToSurveyAdmins = async ({ user, surveyInfo }, client = db) => {
  if (!User.isSystemAdmin(user)) {
    const surveyAdminsGroup = Survey.getAuthGroupAdmin(surveyInfo)
    await UserManager.addUserToGroup({ user, surveyInfo, group: surveyAdminsGroup, userToAdd: user }, client)
  }
}

/**
 * Creates a new survey given the specified parameters.
 *
 * @param {!object} params - The survey creation parameters.
 * @param {!object} params.user - The user creating the survey.
 * @param {!object} params.surveyInfo - The survey info to insert.
 * @param {boolean} [params.createRootEntityDef=true] - Whether to create the root entity definition.
 * @param {boolean} [params.system=false] - Whether the creation comes from a real user or it's a system activity (survey import).
 * @param {boolean} [params.updateUserPrefs=true] - Whether to update the user preferred survey after the creation.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<Survey>} - The newly created survey object.
 */
export const insertSurvey = async (params, client = db) => {
  const {
    user,
    surveyInfo: surveyInfoParam,
    createRootEntityDef = true,
    system = false,
    updateUserPrefs = true,
    temporary = false,
  } = params

  return client.tx(async (t) => {
    // Insert survey into db
    const surveyProps = { ...Survey.getProps(surveyInfoParam) }
    if (temporary) {
      surveyProps.temporary = true
    }
    const surveyInfo = await SurveyRepository.insertSurvey({ survey: surveyInfoParam, propsDraft: surveyProps }, t)
    const survey = assocSurveyInfo(surveyInfo)
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)

    // Create survey data schema
    await DBMigrator.migrateSurveySchema(surveyId)

    // Log survey create activity
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyCreate, surveyInfo, system, t)

    if (createRootEntityDef) {
      // Insert root entity def
      const rootEntityDef = NodeDef.newNodeDef(
        null,
        NodeDef.nodeDefType.entity,
        [Survey.cycleOneKey], // Use first (and only) cycle
        {
          [NodeDef.propKeys.name]: 'root_entity',
          [NodeDef.propKeys.multiple]: false,
          [NodeDefLayout.keys.layout]: NodeDefLayout.newLayout(
            Survey.cycleOneKey,
            NodeDefLayout.renderType.form,
            uuidv4()
          ),
        }
      )
      await NodeDefManager.insertNodeDef({ user, survey, nodeDef: rootEntityDef, system: true }, t)
    }

    if (updateUserPrefs) {
      const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
      await UserRepository.updateUserPrefs(userUpdated, t)
    }

    // Create default groups for this survey
    surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(), t)

    await _addUserToSurveyAdmins({ user, surveyInfo }, t)

    return assocSurveyInfo(surveyInfo)
  })
}

export const importSurvey = async (params, client = db) => {
  const { user, surveyInfo: surveyInfoParam, authGroups = Survey.getDefaultAuthGroups(), backup } = params

  return client.tx(async (t) => {
    // Insert survey into db
    let surveyInfo = await SurveyRepository.insertSurvey(
      {
        survey: surveyInfoParam,
        props: backup ? Survey.getProps(surveyInfoParam) : {},
        propsDraft: backup ? Survey.getPropsDraft(surveyInfoParam) : Survey.getProps(surveyInfoParam),
      },
      t
    )
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)

    // Create survey data schema
    await DBMigrator.migrateSurveySchema(surveyId)

    // Create default groups for this survey
    surveyInfo = Survey.assocAuthGroups(await AuthGroupRepository.createSurveyGroups(surveyId, authGroups, t))(
      surveyInfo
    )

    surveyInfo = await _fetchAndAssocAdditionalInfo({ surveyInfo }, t)

    await _addUserToSurveyAdmins({ user, surveyInfo }, t)

    return assocSurveyInfo(surveyInfo)
  })
}

// ====== READ
export const {
  countOwnedSurveys,
  countUserSurveys,
  fetchAllSurveyIds,
  fetchSurveysByName,
  fetchSurveyIdsAndNames,
  fetchDependencies,
  fetchFilesTotalSpace,
} = SurveyRepository

export const fetchSurveyById = async ({ surveyId, draft = false, validate = false, backup = false }, client = db) => {
  const [surveyInfo, authGroups] = await Promise.all([
    SurveyRepository.fetchSurveyById({ surveyId, draft, backup }, client),
    AuthGroupRepository.fetchSurveyGroups(surveyId, client),
  ])

  let surveyInfoUpdated = Survey.assocAuthGroups(authGroups)(surveyInfo)
  surveyInfoUpdated = await _fetchAndAssocAdditionalInfo({ surveyInfo: surveyInfoUpdated }, client)

  const validation = validate ? await validateSurveyInfo(surveyInfoUpdated) : null

  return assocSurveyInfo({
    ...surveyInfoUpdated,
    validation,
  })
}

export const fetchSurveyAndNodeDefsBySurveyId = async (
  {
    surveyId,
    cycle = null,
    draft = false,
    advanced = false,
    validate = false,
    includeDeleted = false,
    backup = false,
    includeAnalysis = true,
  },
  client = db
) => {
  const surveyDb = await fetchSurveyById({ surveyId, draft, validate, backup }, client)
  const surveyCycles = Survey.getCycleKeys(
    backup ? { ...surveyDb, props: ObjectUtils.getPropsAndPropsDraftCombined(surveyDb) } : surveyDb
  )
  const [nodeDefs, dependencies, categories, taxonomies] = await Promise.all([
    NodeDefManager.fetchNodeDefsBySurveyId(
      { surveyId, surveyCycles, cycle, draft, advanced, includeDeleted, backup, includeAnalysis },
      client
    ),
    fetchDependencies(surveyId, client),
    CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft }, client),
    TaxonomyRepository.fetchTaxonomiesBySurveyId({ surveyId, draft }, client),
  ])

  let survey = R.pipe(
    Survey.assocNodeDefsSimple({ nodeDefs }),
    Survey.assocCategories(categories),
    Survey.assocTaxonomies(ObjectUtils.toUuidIndexedObj(taxonomies))
  )(surveyDb)

  if (Objects.isEmpty(dependencies)) {
    survey = await Survey.buildAndAssocDependencyGraph(survey)
  } else {
    survey = Survey.assocDependencyGraph(dependencies)(survey)
  }
  if (validate) {
    const validation = await SurveyValidator.validateNodeDefs(survey)
    survey = Survey.assocNodeDefsValidation(validation)(survey)
  }
  return survey
}

export const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (
  {
    surveyId,
    cycle = null,
    draft = false,
    advanced = false,
    validate = false,
    includeDeleted = false,
    includeAnalysis = true,
    backup = false,
    includeBigCategories = false,
    includeBigTaxonomies = false,
  },
  client = db
) => {
  const survey = await fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, cycle, draft, advanced, validate, includeDeleted, includeAnalysis, backup },
    client
  )
  const categoryItemsRefData = await CategoryRepository.fetchIndex({ surveyId, draft, includeBigCategories }, client)
  const taxaIndexRefData = await TaxonomyRepository.fetchTaxaWithVernacularNames(
    { surveyId, draft, includeBigTaxonomies },
    client
  )

  return Survey.assocRefData({ categoryItemsRefData, taxaIndexRefData })(survey)
}

export const fetchUserSurveysInfo = async (
  {
    user,
    draft = true,
    template = false,
    offset,
    limit,
    lang,
    search,
    sortBy,
    sortOrder,
    includeCounts = false,
    includeOwnerEmailAddress = false,
    onlyOwn = false,
  },
  client = db
) => {
  // check sortBy is valid
  if (sortBy && !Object.values(Survey.sortableKeys).includes(sortBy)) {
    throw new SystemError(`Invalid sortBy specified: ${sortBy}`)
  }
  // check sortOrder is valid
  if (sortOrder && !['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    throw new SystemError(`Invalid sortOrder specified: ${sortOrder}`)
  }
  return client.tx(async (tx) => {
    const surveys = (
      await SurveyRepository.fetchUserSurveys({
        user,
        draft,
        template,
        offset,
        limit,
        lang,
        search,
        sortBy,
        sortOrder,
        includeOwnerEmailAddress,
        onlyOwn,
      })
    ).map(assocSurveyInfo)

    if (!includeCounts) {
      return surveys
    }
    return Promise.all(
      surveys.map(async (survey) => {
        const surveyId = Survey.getId(survey)
        const canHaveData = Survey.canHaveData(survey)
        const { count: filesCount, total: filesSize } = await FileManager.fetchCountAndTotalFilesSize({ surveyId }, tx)
        return {
          ...survey,
          cycles: Survey.getCycleKeys(survey).length,
          languages: Survey.getLanguages(survey).join('|'),
          nodeDefsCount: await NodeDefRepository.countNodeDefsBySurveyId({ surveyId, draft }, tx),
          recordsCount: canHaveData ? await RecordRepository.countRecordsBySurveyId({ surveyId }, tx) : 0,
          recordsCountByApp: canHaveData ? await RecordRepository.countRecordsGroupedByApp({ surveyId }, tx) : {},
          chainsCount: await ChainRepository.countChains({ surveyId }, tx),
          filesCount,
          filesSize,
          filesMissing: await NodeRepository.countNodesWithMissingFile({ surveyId }, tx),
        }
      })
    )
  })
}

// ====== UPDATE
export const updateSurveyProp = async (user, surveyId, key, value, system = false, client = db) =>
  client.tx(async (t) => {
    await Promise.all([
      SurveyRepository.updateSurveyProp(surveyId, key, value, t),
      SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, system, t),
    ])

    return fetchSurveyById({ surveyId, draft: true, validate: true }, t)
  })

const updateSurveyCyclesProp = async ({ surveyId, value, valuePrev }, client = db) => {
  const cycles = Object.keys(value)
  const cyclesPrev = Object.keys(valuePrev)
  // Add new cycles to nodeDefs
  const cyclesAdded = R.difference(cycles, cyclesPrev)
  if (!R.isEmpty(cyclesAdded)) {
    await NodeDefManager.addNodeDefsCycles(surveyId, R.last(cyclesPrev), cyclesAdded, client)
  }

  // Remove delete cycles from nodeDefs
  const cyclesRemoved = R.difference(cyclesPrev, cycles)
  if (!R.isEmpty(cyclesRemoved)) {
    await NodeDefManager.deleteNodeDefsCycles(surveyId, cyclesRemoved, client)
  }
}

export const updateSurveyProps = async (user, surveyId, props, client = db) =>
  client.tx(async (t) => {
    const validation = await validateSurveyInfo({ id: surveyId, props })
    if (!Validation.isValid(validation)) {
      return assocSurveyInfo({ validation })
    }
    const surveyInfoPrev = Survey.getSurveyInfo(await fetchSurveyById({ surveyId, draft: true }, t))
    const propsPrev = ObjectUtils.getProps(surveyInfoPrev)

    for (const [key, value] of Object.entries(props)) {
      const valuePrev = propsPrev[key]

      if (!R.equals(value, valuePrev)) {
        await Promise.all([
          SurveyRepository.updateSurveyProp(surveyId, key, value, t),
          SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
          ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, false, t),
        ])

        if (key === Survey.infoKeys.cycles) {
          await updateSurveyCyclesProp({ surveyId, value, valuePrev }, t)
        }
      }
    }
    return fetchSurveyById({ surveyId, draft: true, validate: true }, t)
  })

export const publishSurveyProps = async (surveyId, langsDeleted, client = db) =>
  client.tx(async (t) => {
    await SurveyRepository.publishSurveyProps(surveyId, t)
    if (!R.isEmpty(langsDeleted)) {
      await SurveyRepository.deleteSurveyLabelsAndDescriptions(surveyId, langsDeleted, t)
    }
  })

export const unpublishSurveyProps = async (surveyId, client = db) =>
  SurveyRepository.unpublishSurveyProps(surveyId, client)

export const updateSurveyConfigurationProp = async ({ surveyId, key, value }, client = db) => {
  if (key !== Survey.configKeys.filesTotalSpace) {
    throw new Error(`Configuration key update not supported: ${key}`)
  }
  const valueLimited = Numbers.limit({
    minValue: FileManager.defaultSurveyFilesTotalSpaceMB,
    maxValue: FileManager.maxSurveyFilesTotalSpaceMB,
  })(value)
  if (valueLimited === FileManager.defaultSurveyFilesTotalSpaceMB) {
    await SurveyRepository.clearSurveyConfiguration({ surveyId }, client)
  } else {
    await SurveyRepository.updateSurveyConfigurationProp({ surveyId, key, value: String(valueLimited) }, client)
  }
  return fetchSurveyById({ surveyId, draft: true, validate: true }, client)
}

export const updateSurveyOwner = async ({ user, surveyId, ownerUuid }, client = db) =>
  client.tx(async (t) => {
    await SurveyRepository.updateSurveyOwner({ surveyId, ownerUuid }, t)
    const systemActivity = false
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.surveyOwnerUpdate,
      { ownerUuid },
      systemActivity,
      t
    )
  })

export const { removeSurveyTemporaryFlag, updateSurveyDependencyGraphs } = SurveyRepository

// ====== DELETE
export const deleteSurvey = async (surveyId, { deleteUserPrefs = true } = {}, client = db) => {
  // fetch file uuids to delete before survey schema is dropped
  const filesToDeleteUuids = !FileManager.isFileContentStoredInDB()
    ? await FileManager.fetchFileUuidsBySurveyId({ surveyId }, client)
    : []

  await client.tx(async (t) => {
    if (deleteUserPrefs) {
      await UserRepository.deleteUsersPrefsSurvey(surveyId, t)
    }
    await SurveyRepository.deleteSurvey(surveyId, t)
    await SurveyRepository.dropSurveySchema(surveyId, t)
    await SchemaRdbRepository.dropSchema(surveyId, t)
  })
  if (filesToDeleteUuids.length > 0) {
    await FileManager.deleteSurveyFilesContentByUuids({ surveyId, fileUuids: filesToDeleteUuids })
  }
}

export const deleteTemporarySurveys = async ({ olderThan24Hours }, client = db) =>
  client.tx(async (t) => {
    const surveyIds = await SurveyRepository.fetchTemporarySurveyIds({ olderThan24Hours }, t)
    for (const surveyId of surveyIds) {
      await deleteSurvey(surveyId, { deleteUserPrefs: true }, t)
    }
    return surveyIds.length
  })

export const { dropSurveySchema } = SurveyRepository
