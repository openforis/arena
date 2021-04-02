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

import * as AuthGroup from '@core/auth/authGroup'

import { db } from '@server/db/db'
import { DBMigrator } from '@openforis/arena-server'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as SurveyRepositoryUtils from '../repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../repository/surveyRepository'

const assocSurveyInfo = (info) => ({ info })

// ====== VALIDATION

export const validateNewSurvey = async (newSurvey) => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name) // TODO add object model for newSurvey
  return SurveyValidator.validateNewSurvey(newSurvey, surveyInfos)
}

const validateSurveyInfo = async (surveyInfo) =>
  SurveyValidator.validateSurveyInfo(surveyInfo, await SurveyRepository.fetchSurveysByName(Survey.getName(surveyInfo)))

// ====== CREATE

/**
 * Creates a new survey given the specified parameters.
 *
 * @param {!object} params - The survey creation parameters.
 * @param {!object} params.user - The user creating the survey.
 * @param {!object} params.surveyInfo - The survey info to insert.
 * @param {boolean} [params.createRootEntityDef=true] - Whether to create the root entity definition.
 * @param {boolean} [params.system=true] - Whether the creation comes from a real user or it's a system activity (survey import).
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 * @returns {Promise<Survey>} - The newly created survey object.
 */
export const insertSurvey = async (params, client = db) => {
  const { user, surveyInfo: surveyInfoParam, createRootEntityDef = true, system = false } = params
  const survey = await client.tx(async (t) => {
    // Insert survey into db
    const surveyInfo = await SurveyRepository.insertSurvey(surveyInfoParam, t)
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
      await NodeDefManager.insertNodeDef({ user, surveyId, nodeDef: rootEntityDef, system: true }, t)
    }

    // Update user prefs
    const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(userUpdated, t)

    // Create default groups for this survey
    surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(), t)

    // Add user to survey admins group (if not system admin)
    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyId,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfo)),
        User.getUuid(user),
        t
      )
    }

    return surveyInfo
  })

  return assocSurveyInfo(survey)
}

export const importSurvey = async (params, client = db) => {
  const { user, surveyInfo: surveyInfoParam, authGroups = Survey.getDefaultAuthGroups() } = params
  const survey = await client.tx(async (t) => {
    // Insert survey into db
    const surveyInfo = await SurveyRepository.insertSurvey(surveyInfoParam, t)
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)

    // Create survey data schema
    await DBMigrator.migrateSurveySchema(surveyId)

    // Update user prefs
    const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(userUpdated, t)

    // Create default groups for this survey
    surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, authGroups, t)

    // Add user to survey admins group (if not system admin)
    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyId,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfo)),
        User.getUuid(user),
        t
      )
    }

    return surveyInfo
  })

  return assocSurveyInfo(survey)
}
// ====== READ
export const { fetchAllSurveyIds } = SurveyRepository

export const fetchSurveyById = async (surveyId, draft = false, validate = false, client = db) => {
  const [surveyInfo, authGroups] = await Promise.all([
    SurveyRepository.fetchSurveyById(surveyId, draft, client),
    AuthGroupRepository.fetchSurveyGroups(surveyId, client),
  ])
  const validation = validate ? await validateSurveyInfo(surveyInfo) : null

  return assocSurveyInfo({ ...surveyInfo, authGroups, validation })
}

export const fetchSurveyAndNodeDefsBySurveyId = async (
  surveyId,
  cycle = null,
  draft = false,
  advanced = false,
  validate = false,
  includeDeleted = false,
  client = db
) => {
  const [surveyDb, nodeDefs] = await Promise.all([
    fetchSurveyById(surveyId, draft, validate, client),
    NodeDefManager.fetchNodeDefsBySurveyId(surveyId, cycle, draft, advanced, includeDeleted, client),
  ])
  const survey = Survey.assocNodeDefs({ nodeDefs, updateDependencyGraph: validate })(surveyDb)

  return validate ? Survey.assocNodeDefsValidation(await SurveyValidator.validateNodeDefs(survey))(survey) : survey
}

export const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (
  surveyId,
  cycle = null,
  draft = false,
  advanced = false,
  validate = false,
  includeDeleted = false,
  client = db
) => {
  const [survey, categoryItemsRefData, taxaIndexRefData] = await Promise.all([
    fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, draft, advanced, validate, includeDeleted, client),
    CategoryRepository.fetchIndex(surveyId, draft, client),
    TaxonomyRepository.fetchIndex(surveyId, draft, client),
  ])

  return Survey.assocRefData({ categoryItemsRefData, taxaIndexRefData })(survey)
}

export const fetchUserSurveysInfo = async (user, offset, limit) =>
  R.map(assocSurveyInfo, await SurveyRepository.fetchUserSurveys(user, offset, limit))

export const { countUserSurveys, fetchDependencies } = SurveyRepository

// ====== UPDATE
export const updateSurveyProp = async (user, surveyId, key, value, system = false, client = db) =>
  client.tx(async (t) => {
    await Promise.all([
      SurveyRepository.updateSurveyProp(surveyId, key, value, t),
      SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, system, t),
    ])

    return fetchSurveyById(surveyId, true, true, t)
  })

export const updateSurveyProps = async (user, surveyId, props, client = db) =>
  client.tx(async (t) => {
    const validation = await validateSurveyInfo({ id: surveyId, props })
    if (Validation.isValid(validation)) {
      const surveyInfoPrev = Survey.getSurveyInfo(await fetchSurveyById(surveyId, true, false, t))
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
      return fetchSurveyById(surveyId, true, true, t)
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

export const { updateSurveyDependencyGraphs } = SurveyRepository

// ====== DELETE
export const deleteSurvey = async (surveyId) =>
  db.tx(async (t) => {
    await Promise.all([
      UserRepository.deleteUsersPrefsSurvey(surveyId, t),
      SurveyRepository.dropSurveySchema(surveyId, t),
      SchemaRdbRepository.dropSchema(surveyId, t),
      SurveyRepository.deleteSurvey(surveyId, t),
    ])
  })

export const { dropSurveySchema, cloneTables } = SurveyRepository
