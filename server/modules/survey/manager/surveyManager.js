import * as R from 'ramda'

import * as ActivityLog from '@common/activityLog/activityLog'

import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as User from '@core/user/user'
import * as UserAnalysis from '@core/user/userAnalysis'
import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

import * as AuthGroup from '@core/auth/authGroup'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import { migrateSurveySchema } from '@server/db/migration/dbMigrator'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as CategoryRepository from '@server/modules/category/repository/categoryRepository'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SchemaRdbRepository from '@server/modules/surveyRdb/repository/schemaRdbRepository'
import * as TaxonomyRepository from '@server/modules/taxonomy/repository/taxonomyRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserAnalysisManager from '@server/modules/user/manager/userAnalysisManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as SurveyRepositoryUtils from '../repository/surveySchemaRepositoryUtils'
import * as SurveyRepository from '../repository/surveyRepository'

const assocSurveyInfo = info => ({ info })

// ====== VALIDATION

export const validateNewSurvey = async newSurvey => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name) // TODO add object model for newSurvey
  return await SurveyValidator.validateNewSurvey(newSurvey, surveyInfos)
}

const validateSurveyInfo = async surveyInfo =>
  await SurveyValidator.validateSurveyInfo(
    surveyInfo,
    await SurveyRepository.fetchSurveysByName(Survey.getName(surveyInfo)),
  )

// ====== CREATE

export const createSurvey = async (
  user,
  { name, label, languages, collectUri = null },
  createRootEntityDef = true,
  system = false,
  client = db,
) => {
  const surveyParam = Survey.newSurvey(User.getUuid(user), name, label, languages, collectUri)
  return await insertSurvey(user, surveyParam, createRootEntityDef, system, client)
}

export const insertSurvey = async (user, surveyParam, createRootEntityDef = true, system = false, client = db) => {
  const survey = await client.tx(async t => {
    // Insert survey into db
    const surveyInfo = await SurveyRepository.insertSurvey(surveyParam, t)
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)

    // Create survey data schema
    await migrateSurveySchema(surveyId)

    // Log survey create activity
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyCreate, surveyParam, system, t)

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
            uuidv4(),
          ),
        },
      )
      await NodeDefManager.insertNodeDef(user, surveyId, Survey.cycleOneKey, rootEntityDef, true, t)
    }

    // Update user prefs
    user = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(user, t)

    // Create default groups for this survey
    surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(), t)

    // Add user to survey admins group (if not system admin)
    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyId,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfo)),
        User.getUuid(user),
        t,
      )
    }

    return surveyInfo
  })

  return assocSurveyInfo(survey)
}

// ====== READ
export const fetchAllSurveyIds = SurveyRepository.fetchAllSurveyIds

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
  client = db,
) => {
  const [surveyDb, nodeDefs] = await Promise.all([
    fetchSurveyById(surveyId, draft, validate, client),
    NodeDefManager.fetchNodeDefsBySurveyId(surveyId, cycle, draft, advanced, includeDeleted, client),
  ])
  const survey = R.pipe(
    Survey.assocNodeDefs(nodeDefs),
    R.when(R.always(validate), Survey.buildAndAssocDependencyGraph),
  )(surveyDb)

  return validate ? Survey.assocNodeDefsValidation(await SurveyValidator.validateNodeDefs(survey))(survey) : survey
}

export const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (
  surveyId,
  cycle = null,
  draft = false,
  advanced = false,
  validate = false,
  includeDeleted = false,
  client = db,
) => {
  const [survey, categoryIndexRS, taxonomyIndexRS] = await Promise.all([
    fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, draft, advanced, validate, includeDeleted, client),
    CategoryRepository.fetchIndex(surveyId, draft, client),
    TaxonomyRepository.fetchIndex(surveyId, draft, client),
  ])

  return Survey.assocRefData(categoryIndexRS, taxonomyIndexRS)(survey)
}

export const fetchUserSurveysInfo = async (user, offset, limit) =>
  R.map(assocSurveyInfo, await SurveyRepository.fetchUserSurveys(user, offset, limit))

export const countUserSurveys = SurveyRepository.countUserSurveys
export const fetchDependencies = SurveyRepository.fetchDependencies

// ====== UPDATE
export const updateSurveyProp = async (user, surveyId, key, value, system = false, client = db) =>
  await client.tx(async t => {
    await Promise.all([
      SurveyRepository.updateSurveyProp(surveyId, key, value, t),
      SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, system, t),
    ])

    return await fetchSurveyById(surveyId, true, true, t)
  })

export const updateSurveyProps = async (user, surveyId, props, client = db) =>
  await client.tx(async t => {
    const validation = await validateSurveyInfo({ id: surveyId, props })
    if (Validation.isValid(validation)) {
      const surveyInfoPrev = Survey.getSurveyInfo(await fetchSurveyById(surveyId, true, false, t))
      const propsPrev = ObjectUtils.getProps(surveyInfoPrev)

      for (const key of Object.keys(props)) {
        const value = props[key]
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
      }

      return await fetchSurveyById(surveyId, true, true, t)
    }

    return assocSurveyInfo({ validation })
  })

export const publishSurveyProps = async (surveyId, langsDeleted, client = db) =>
  await client.tx(async t => {
    await SurveyRepository.publishSurveyProps(surveyId, t)
    if (!R.isEmpty(langsDeleted)) {
      await SurveyRepository.deleteSurveyLabelsAndDescriptions(surveyId, langsDeleted, t)
    }
  })

export const updateSurveyDependencyGraphs = SurveyRepository.updateSurveyDependencyGraphs

// ====== DELETE
export const deleteSurvey = async surveyId =>
  await db.tx(async t => {
    // Fetch user analysis before survey is deleted
    const userAnalysis = await UserAnalysisManager.fetchUserAnalysisBySurveyId(surveyId, t)

    await Promise.all([
      UserRepository.deleteUsersPrefsSurvey(surveyId, t),
      SurveyRepository.dropSurveySchema(surveyId, t),
      SchemaRdbRepository.dropSchema(surveyId, t),
      SurveyRepository.deleteSurvey(surveyId, t),
    ])

    // Delete user analysis after rdb and survey schemas have been deleted
    await DbUtils.dropUser(UserAnalysis.getName(userAnalysis), t)
  })

export const dropSurveySchema = SurveyRepository.dropSurveySchema
