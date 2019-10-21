import * as R from 'ramda'

import db from '../../../db/db'

import { migrateSurveySchema } from '../../../db/migration/dbMigrator'
import { uuidv4 } from '../../../../core/uuid'

import Survey from '../../../../core/survey/survey'
import SurveyValidator from '../../../../core/survey/surveyValidator'
import NodeDef from '../../../../core/survey/nodeDef'
import NodeDefLayout from '../../../../core/survey/nodeDefLayout'
import User from '../../../../core/user/user'
import ObjectUtils from '../../../../core/objectUtils'
import Validation from '../../../../core/validation/validation'

import SurveyRdbManager from '../../surveyRdb/manager/surveyRdbManager'
import NodeDefManager from '../../nodeDef/manager/nodeDefManager'
import UserManager from '../../user/manager/userManager'
import AuthGroups from '../../../../core/auth/authGroups'

import SurveyRepository from '../repository/surveyRepository'
import CategoryRepository from '../../category/repository/categoryRepository'
import TaxonomyRepository from '../../taxonomy/repository/taxonomyRepository'
import UserRepository from '../../user/repository/userRepository'
import AuthGroupRepository from '../../auth/repository/authGroupRepository'
import SurveyRepositoryUtils from '../repository/surveySchemaRepositoryUtils'

import ActivityLog from '../../activityLog/activityLogger'

const assocSurveyInfo = info => ({ info })

// ====== VALIDATION

export const validateNewSurvey = async newSurvey => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name)//TODO add object model for newSurvey
  return await SurveyValidator.validateNewSurvey(newSurvey, surveyInfos)
}

const validateSurveyInfo = async surveyInfo => await SurveyValidator.validateSurveyInfo(
  surveyInfo,
  await SurveyRepository.fetchSurveysByName(Survey.getName(surveyInfo))
)

// ====== CREATE

export const createSurvey = async (user, { name, label, lang, collectUri = null }, createRootEntityDef = true, client: any = db) => {
  const surveyParam = Survey.newSurvey(User.getUuid(user), name, label, lang, collectUri)
  return await insertSurvey(user, surveyParam, createRootEntityDef, client)
}

export const insertSurvey = async (user, surveyParam, createRootEntityDef = true, client: any = db) => {
  const survey = await client.tx(
    async t => {
      // insert survey into db
      const surveyInfo = await SurveyRepository.insertSurvey(surveyParam, t)
      const surveyId = Survey.getIdSurveyInfo(surveyInfo)

      // create survey data schema
      await migrateSurveySchema(surveyId)

      // log survey create activity
      await ActivityLog.log(user, surveyId, ActivityLog.type.surveyCreate, surveyParam, t)

      if (createRootEntityDef) {
        // insert root entity def
        const rootEntityDef = NodeDef.newNodeDef(
          null,
          NodeDef.nodeDefType.entity,
          Survey.cycleOneKey, //use first (and only) cycle
          {
            name: 'root_entity',
            multiple: false,
            layout: NodeDefLayout.newLayout(
              Survey.cycleOneKey,
              NodeDefLayout.renderType.form,
              uuidv4()
            )
          }
        )
        await NodeDefManager.insertNodeDef(user, surveyId, rootEntityDef, t)
      }

      // update user prefs
      user = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
      await UserRepository.updateUserPrefs(user, t)

      // create default groups for this survey
      surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(), t)

      // add user to survey admins group (if not system admin)
      if (!User.isSystemAdmin(user)) {
        await UserManager.addUserToGroup(user, surveyId, AuthGroups.getUuid(Survey.getAuthGroupAdmin(surveyInfo)), User.getUuid(user), t)
      }

      return surveyInfo
    }
  )

  return assocSurveyInfo(survey)
}

// ====== READ
export const fetchSurveyById = async (surveyId, draft = false, validate = false, client: any = db) => {
  const [surveyInfo, authGroups] = await Promise.all([
    SurveyRepository.fetchSurveyById(surveyId, draft, client),
    AuthGroupRepository.fetchSurveyGroups(surveyId, client)
  ])
  const validation = validate ? await validateSurveyInfo(surveyInfo) : null

  return assocSurveyInfo({ ...surveyInfo, authGroups, validation })
}

export const fetchSurveyAndNodeDefsBySurveyId = async (surveyId, cycle = null, draft = false, advanced = false, validate = false, includeDeleted = false, client: any = db) => {
  const [surveyDb, nodeDefs] = await Promise.all([
    fetchSurveyById(surveyId, draft, validate, client),
    NodeDefManager.fetchNodeDefsBySurveyId(surveyId, cycle, draft, advanced, includeDeleted, client)
  ])
  const survey = Survey.assocNodeDefs(nodeDefs)(surveyDb)

  return validate
    ? Survey.assocNodeDefsValidation(await SurveyValidator.validateNodeDefs(survey))(survey)
    : survey
}

export const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (surveyId, cycle = null, draft = false, advanced = false, validate = false, includeDeleted = false, client: any = db) => {
  const [survey, categoryIndexRS, taxonomyIndexRS] = await Promise.all([
    fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, draft, advanced, validate, includeDeleted, client),
    CategoryRepository.fetchIndex(surveyId, draft, client),
    TaxonomyRepository.fetchIndex(surveyId, draft, client)
  ])

  return Survey.assocRefData(categoryIndexRS, taxonomyIndexRS)(survey)
}

export const fetchUserSurveysInfo = async (user, offset, limit) => R.map(
  assocSurveyInfo,
  await SurveyRepository.fetchUserSurveys(user, offset, limit)
)

// ====== UPDATE
export const updateSurveyProp = async (user, surveyId, key, value, client: any = db) =>
  await client.tx(async t => {
    await Promise.all([
      SurveyRepository.updateSurveyProp(surveyId, key, value, t),
      SurveyRepositoryUtils.markSurveyDraft(surveyId, t),
      ActivityLog.log(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, t),
    ])

    return await fetchSurveyById(surveyId, true, true, t)
  })

export const updateSurveyProps = async (user, surveyId, props, client: any = db) =>
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
            ActivityLog.log(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, t)
          ])

          if (key === Survey.infoKeys.cycles) {
            const cycles = Object.keys(value)
            const cyclesPrev = Object.keys(valuePrev)
            // add new cycles to nodeDefs
            const cyclesAdded = R.difference(cycles, cyclesPrev)
            if (!R.isEmpty(cyclesAdded)) {
              await NodeDefManager.addNodeDefsCycles(surveyId, R.last(cyclesPrev), cyclesAdded, t)
            }
            // remove delete cycles from nodeDefs
            const cyclesRemoved = R.difference(cyclesPrev, cycles)
            if (!R.isEmpty(cyclesRemoved)) {
              await NodeDefManager.deleteNodeDefsCycles(surveyId, cyclesRemoved, t)
            }
          }
        }
      }

      return await fetchSurveyById(surveyId, true, true, t)
    } else {
      return assocSurveyInfo({ validation })
    }
  })

export const publishSurveyProps = async (surveyId, langsDeleted, client: any = db) =>
  await client.tx(async t => {
    const surveyUpdated = await SurveyRepository.publishSurveyProps(surveyId, t)
    if (!R.isEmpty(langsDeleted))
      await SurveyRepository.deleteSurveyLabelsAndDescriptions(surveyId, langsDeleted, t)
    return surveyUpdated
  })

// ====== DELETE
export const deleteSurvey = async surveyId => await db.tx(async t =>
  await Promise.all([
    UserRepository.deleteUsersPrefsSurvey(surveyId, t),
    SurveyRepository.dropSurveySchema(surveyId, t),
    SurveyRdbManager.dropSchema(surveyId, t),
    SurveyRepository.deleteSurvey(surveyId, t),
  ])
)



// const fetchAllSurveyIds = SurveyRepository.fetchAllSurveyIds
// const countUserSurveys = SurveyRepository.countUserSurveys
// const fetchDependencies = SurveyRepository.fetchDependencies
// const updateSurveyDependencyGraphs = SurveyRepository.updateSurveyDependencyGraphs
// const dropSurveySchema = SurveyRepository.dropSurveySchema


export default {
  // ====== VALIDATION
  validateNewSurvey,

  // ====== CREATE
  createSurvey,
  insertSurvey,

  // ====== READ
  fetchAllSurveyIds: SurveyRepository.fetchAllSurveyIds,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  fetchSurveyAndNodeDefsAndRefDataBySurveyId,
  fetchUserSurveysInfo,
  countUserSurveys: SurveyRepository.countUserSurveys,
  fetchDependencies: SurveyRepository.fetchDependencies,

  // ====== UPDATE
  updateSurveyProp,
  updateSurveyProps,
  publishSurveyProps,
  updateSurveyDependencyGraphs: SurveyRepository.updateSurveyDependencyGraphs,

  // ====== DELETE
  deleteSurvey,
  dropSurveySchema: SurveyRepository.dropSurveySchema,
}

