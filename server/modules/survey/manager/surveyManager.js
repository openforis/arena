import pgPromise from 'pg-promise'
import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as User from '@core/user/user'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'
import * as PromiseUtils from '@core/promiseUtils'

import { db } from '@server/db/db'
import { DBMigrator } from '@openforis/arena-server'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as NodeDefRepository from '@server/modules/nodeDef/repository/nodeDefRepository'
import * as RecordRepository from '@server/modules/record/repository/recordRepository'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'
import * as SrsRepository from '@server/modules/geo/repository/srsRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as SurveyRepositoryUtils from '../repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../repository/surveyRepository'
import SystemError from '@core/systemError'

const assocSurveyInfo = (survey) => survey

// ====== VALIDATION

export const validateNewSurvey = async ({ newSurvey }) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name) // TODO add object model for newSurvey
  return SurveyValidator.validateNewSurvey({ newSurvey, surveyInfos })
}

export const validateSurveyClone = async ({ newSurvey }) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name)
  return SurveyValidator.validateSurveyClone({ newSurvey, surveyInfos })
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

    // fetch SRS from DB
    const srsCodes = Survey.getSRSCodes(surveyInfo)
    const srss = await SrsRepository.fetchSrssByCodes({ srsCodes }, t)
    surveyInfo = Survey.assocSrs(srss)(surveyInfo)

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
} = SurveyRepository

export const fetchSurveyById = async ({ surveyId, draft = false, validate = false, backup = false }, client = db) => {
  const [surveyInfo, authGroups] = await Promise.all([
    SurveyRepository.fetchSurveyById({ surveyId, draft, backup }, client),
    AuthGroupRepository.fetchSurveyGroups(surveyId, client),
  ])

  const srsCodes = Survey.getSRSCodes(surveyInfo)
  const srss = await SrsRepository.fetchSrssByCodes({ srsCodes }, client)
  const surveyInfoUpdated = R.pipe(Survey.assocSrs(srss), Survey.assocAuthGroups(authGroups))(surveyInfo)

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
  const [surveyDb, nodeDefs, dependencies, categories, taxonomies] = await Promise.all([
    fetchSurveyById({ surveyId, draft, validate, backup }, client),
    NodeDefManager.fetchNodeDefsBySurveyId(
      { surveyId, cycle, draft, advanced, includeDeleted, backup, includeAnalysis },
      client
    ),
    fetchDependencies(surveyId, client),
    CategoryRepository.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft }, client),
    TaxonomyRepository.fetchTaxonomiesBySurveyId({ surveyId, draft }, client),
  ])

  let survey = R.pipe(
    Survey.assocNodeDefs({ nodeDefs }),
    Survey.assocCategories(categories),
    Survey.assocTaxonomies(ObjectUtils.toUuidIndexedObj(taxonomies))
  )(surveyDb)

  if (validate) {
    const dependencyGraph = dependencies || Survey.buildDependencyGraph(survey)
    survey = Survey.assocDependencyGraph(dependencyGraph)(survey)
    const validation = await SurveyValidator.validateNodeDefs(survey)
    survey = Survey.assocNodeDefsValidation(validation)(survey)
  } else if (dependencies) {
    survey = Survey.assocDependencyGraph(dependencies)(survey)
  }
  return survey
}

export const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (
  { surveyId, cycle = null, draft = false, advanced = false, validate = false, includeDeleted = false, backup = false },
  client = db
) => {
  const survey = await fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, cycle, draft, advanced, validate, includeDeleted, backup },
    client
  )
  const categoryItemsRefData = await CategoryRepository.fetchIndex(surveyId, draft, client)
  const taxaIndexRefData = await TaxonomyRepository.fetchTaxaWithVernacularNames({ surveyId, draft }, client)
  return Survey.assocRefData({ categoryItemsRefData, taxaIndexRefData })(survey)
}

export const fetchUserSurveysInfo = async (
  { user, draft = true, template = false, offset, limit, lang, search, sortBy, sortOrder, includeCounts = false },
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
      })
    ).map(assocSurveyInfo)

    if (!includeCounts) {
      return surveys
    }
    return Promise.all(
      surveys.map(async (survey) => {
        const surveyId = Survey.getId(survey)
        return {
          ...survey,
          nodeDefsCount: await NodeDefRepository.countNodeDefsBySurveyId({ surveyId, draft }, tx),
          recordsCount: Survey.canHaveData(survey)
            ? await RecordRepository.countRecordsBySurveyId({ surveyId }, tx)
            : 0,
          chainsCount: await ChainRepository.countChains({ surveyId }, tx),
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

export const updateSurveyProps = async (user, surveyId, props, client = db) =>
  client.tx(async (t) => {
    const validation = await validateSurveyInfo({ id: surveyId, props })
    if (Validation.isValid(validation)) {
      const surveyInfoPrev = Survey.getSurveyInfo(await fetchSurveyById({ surveyId, draft: true }, t))
      const propsPrev = ObjectUtils.getProps(surveyInfoPrev)

      await PromiseUtils.each(Object.entries(props), async ([key, value]) => {
        const valuePrev = propsPrev[key]

        if (!R.equals(value, valuePrev)) {
          await Promise.all([
            SurveyRepository.updateSurveyProp(surveyId, key, value, t),
            SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
            ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, false, t),
          ])

          if (key === Survey.infoKeys.cycles) {
            const cycles = Object.keys(value)
            const cyclesPrev = Object.keys(valuePrev)
            // Add new cycles to nodeDefs
            const cyclesAdded = R.difference(cycles, cyclesPrev)
            if (!R.isEmpty(cyclesAdded)) {
              await NodeDefManager.addNodeDefsCycles(surveyId, R.last(cyclesPrev), cyclesAdded, t)
            }

            // Remove delete cycles from nodeDefs
            const cyclesRemoved = R.difference(cyclesPrev, cycles)
            if (!R.isEmpty(cyclesRemoved)) {
              await NodeDefManager.deleteNodeDefsCycles(surveyId, cyclesRemoved, t)
            }
          }
        }
      })
      return fetchSurveyById({ surveyId, draft: true, validate: true }, t)
    }

    return assocSurveyInfo({ validation })
  })

export const publishSurveyProps = async (surveyId, langsDeleted, client = db) =>
  client.tx(async (t) => {
    await SurveyRepository.publishSurveyProps(surveyId, t)
    if (!R.isEmpty(langsDeleted)) {
      await SurveyRepository.deleteSurveyLabelsAndDescriptions(surveyId, langsDeleted, t)
    }
  })

export const { removeSurveyTemporaryFlag, updateSurveyDependencyGraphs } = SurveyRepository

// ====== DELETE
export const deleteSurvey = async (surveyId, { deleteUserPrefs = true } = {}, client = db) =>
  client.tx(async (t) => {
    if (deleteUserPrefs) {
      await UserRepository.deleteUsersPrefsSurvey(surveyId, t)
    }
    await SurveyRepository.deleteSurvey(surveyId, t)
    await SurveyRepository.dropSurveySchema(surveyId, t)
    await SchemaRdbRepository.dropSchema(surveyId, t)
  })

export const deleteTemporarySurveys = async ({ olderThan24Hours }, client = db) =>
  client.tx(async (t) => {
    const surveyIds = await SurveyRepository.fetchTemporarySurveyIds({ olderThan24Hours }, t)
    await PromiseUtils.each(surveyIds, async (surveyId) => deleteSurvey(surveyId, { deleteUserPrefs: true }, t))
    return surveyIds.length
  })

export const { dropSurveySchema } = SurveyRepository
