const R = require('ramda')

const db = require('../../../db/db')
const { migrateSurveySchema } = require('../../../db/migration/dbMigrator')
const { uuidv4 } = require('../../../../common/uuid')

const Survey = require('../../../../common/survey/survey')
const SurveyValidator = require('../../../../common/survey/surveyValidator')
const NodeDef = require('../../../../common/survey/nodeDef')
const User = require('../../../../common/user/user')
const NodeDefLayout = require('../../../../common/survey/nodeDefLayout')
const ObjectUtils = require('../../../../common/objectUtils')
const Validation = require('../../../../common/validation/validation')

const SurveyRdbManager = require('../../surveyRdb/manager/surveyRdbManager')
const NodeDefManager = require('../../nodeDef/manager/nodeDefManager')
const AuthGroups = require('../../../../common/auth/authGroups')

const SurveyRepository = require('../repository/surveyRepository')
const CategoryRepository = require('../../category/repository/categoryRepository')
const TaxonomyRepository = require('../../taxonomy/repository/taxonomyRepository')
const UserRepository = require('../../user/repository/userRepository')
const AuthGroupRepository = require('../../auth/repository/authGroupRepository')
const SurveyRepositoryUtils = require('../repository/surveySchemaRepositoryUtils')

const ActivityLog = require('../../activityLog/activityLogger')

const assocSurveyInfo = info => ({ info })

// ====== CREATE

const createSurvey = async (user, { name, label, lang, collectUri = null }, createRootEntityDef = true, client = db) => {
  const surveyParam = Survey.newSurvey(User.getUuid(user), name, label, lang, collectUri)
  return await insertSurvey(user, surveyParam, createRootEntityDef, client)
}

const insertSurvey = async (user, surveyParam, createRootEntityDef = true, client = db) => {
  const survey = await client.tx(
    async t => {
      const surveyInfo = await SurveyRepository.insertSurvey(surveyParam, t)
      const surveyId = Survey.getIdSurveyInfo(surveyInfo)

      //create survey data schema
      await migrateSurveySchema(surveyId)

      if (createRootEntityDef) {
        const rootEntityDef = NodeDef.newNodeDef(
          null,
          NodeDef.nodeDefType.entity,
          Survey.cycleOneKey, //use first (and only) cycle
          {
            [NodeDef.propKeys.name]: 'root_entity',
            [NodeDef.propKeys.multiple]: false,
            [NodeDefLayout.nodeDefLayoutProps.pageUuid]: uuidv4(),
            [NodeDefLayout.nodeDefLayoutProps.render]: NodeDefLayout.nodeDefRenderType.form,
          }
        )
        await NodeDefManager.insertNodeDef(user, surveyId, rootEntityDef, t)
      }

      // update user prefs
      user = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
      await UserRepository.updateUserPrefs(user, t)

      // create default groups for this survey
      surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(), t)

      if (!User.isSystemAdmin(user)) {
        await AuthGroupRepository.insertUserGroup(AuthGroups.getUuid(Survey.getAuthGroupAdmin(surveyInfo)), User.getUuid(user), t)
      }

      await ActivityLog.log(user, surveyId, ActivityLog.type.surveyCreate, surveyParam, t)

      return surveyInfo
    }
  )

  return assocSurveyInfo(survey)
}

const validateNewSurvey = async newSurvey => {
  const surveyInfos = await SurveyRepository.fetchSurveysByName(newSurvey.name)//TODO add object model for newSurvey
  return await SurveyValidator.validateNewSurvey(newSurvey, surveyInfos)
}

const validateSurveyInfo = async surveyInfo => await SurveyValidator.validateSurveyInfo(
  surveyInfo,
  await SurveyRepository.fetchSurveysByName(Survey.getName(surveyInfo))
)

// ====== READ
const fetchSurveyById = async (surveyId, draft = false, validate = false, client = db) => {
  const surveyInfo = await SurveyRepository.fetchSurveyById(surveyId, draft, client)
  const authGroups = await AuthGroupRepository.fetchSurveyGroups(surveyInfo.id, client)

  const validation = validate ? await validateSurveyInfo(surveyInfo) : null

  return assocSurveyInfo({ ...surveyInfo, authGroups, validation })
}

const fetchSurveyAndNodeDefsBySurveyId = async (surveyId, cycle = null, draft = false, advanced = false, validate = false, includeDeleted = false, client = db) => {
  const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(surveyId, cycle, draft, advanced, includeDeleted, client)
  const survey = Survey.assocNodeDefs(nodeDefs)(await fetchSurveyById(surveyId, draft, validate, client))

  return validate
    ? Survey.assocNodeDefsValidation(await SurveyValidator.validateNodeDefs(survey))(survey)
    : survey
}

const fetchSurveyAndNodeDefsAndRefDataBySurveyId = async (surveyId, cycle = null, draft = false, advanced = false, validate = false, includeDeleted = false, client = db) => {
  const survey = await fetchSurveyAndNodeDefsBySurveyId(surveyId, cycle, draft, advanced, validate, includeDeleted, client)
  const [categoryIndexRS, taxonomyIndexRS] = await Promise.all([
    CategoryRepository.fetchIndex(surveyId, draft, client),
    TaxonomyRepository.fetchIndex(surveyId, draft, client)
  ])

  return Survey.assocRefData(categoryIndexRS, taxonomyIndexRS)(survey)
}

const fetchUserSurveysInfo = async (user, offset, limit) => R.map(
  assocSurveyInfo,
  await SurveyRepository.fetchUserSurveys(user, offset, limit)
)

// ====== UPDATE
const updateSurveyProp = async (user, surveyId, key, value, client = db) =>
  await client.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, t)
    await SurveyRepository.updateSurveyProp(surveyId, key, value, t)
    await SurveyRepositoryUtils.markSurveyDraft(surveyId, t)

    return await fetchSurveyById(surveyId, true, true, t)
  })

const updateSurveyProps = async (user, surveyId, props, client = db) =>
  await client.tx(async t => {
    const validation = await validateSurveyInfo({ id: surveyId, props })
    if (Validation.isValid(validation)) {

      const surveyInfoPrev = Survey.getSurveyInfo(await fetchSurveyById(surveyId, true, false, t))
      const propsPrev = ObjectUtils.getProps(surveyInfoPrev)

      let updated = false
      for (const key of Object.keys(props)) {
        const value = props[key]
        const valuePrev = propsPrev[key]
        if (!R.equals(value, valuePrev)) {
          await ActivityLog.log(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, t)
          await SurveyRepository.updateSurveyProp(surveyId, key, value, t)
          updated = true

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

      if (updated) {
        await SurveyRepositoryUtils.markSurveyDraft(surveyId, t)
      }

      return await fetchSurveyById(surveyId, true, true, t)
    } else {
      return assocSurveyInfo({ validation })
    }
  })

const publishSurveyProps = async (surveyId, langsDeleted, client = db) => {
  await SurveyRepository.publishSurveyProps(surveyId, client)

  for (const langDeleted of langsDeleted) {
    await SurveyRepository.deleteSurveyLabel(surveyId, langDeleted, client)
    await SurveyRepository.deleteSurveyDescription(surveyId, langDeleted, client)
  }
}

// ====== DELETE
const deleteSurvey = async surveyId => await db.tx(async t =>
  await Promise.all([
    UserRepository.deleteUsersPrefsSurvey(surveyId, t),
    SurveyRepository.dropSurveySchema(surveyId, t),
    SurveyRdbManager.dropSchema(surveyId, t),
    SurveyRepository.deleteSurvey(surveyId, t),
  ])
)

module.exports = {
  // ====== CREATE
  createSurvey,
  insertSurvey,
  validateNewSurvey,

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