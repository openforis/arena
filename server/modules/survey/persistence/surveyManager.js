const R = require('ramda')

const db = require('../../../db/db')
const { migrateSurveySchema } = require('../../../db/migration/dbMigrator')
const { uuidv4 } = require('../../../../common/uuid')
const SurveyRdbManager = require('../../surveyRdb/persistence/surveyRdbManager')

const SurveyRepository = require('./surveyRepository')
const Survey = require('../../../../common/survey/survey')
const SurveyValidator = require('../surveyValidator')

const NodeDefManager = require('../../nodeDef/persistence/nodeDefManager')
const { nodeDefLayoutProps, nodeDefRenderType } = require('../../../../common/survey/nodeDefLayout')

const UserRepository = require('../../user/persistence/userRepository')
const { getUserPrefSurveyId, userPrefNames } = require('../../../../common/user/userPrefs')

const AuthGroupRepository = require('../../auth/persistence/authGroupRepository')
const AuthManager = require('../../../../common/auth/authManager')

const ActivityLog = require('../../activityLog/activityLogger')

const assocSurveyInfo = info => ({ info })

// ====== CREATE
const createSurvey = async (user, { name, label, lang, collectUri = null }, createRootEntity = true, client = db) => {

  const survey = await client.tx(
    async t => {
      const props = {
        name,
        labels: { [lang]: label },
        languages: [lang],
        srs: [{ code: '4326', name: 'GCS WGS 1984' }], //EPSG:4326 WGS84 Lat Lon Spatial Reference System,
        ...collectUri
          ? { collectUri }
          : {}
      }

      const userId = user.id

      // create the survey
      const survey = await SurveyRepository.insertSurvey(props, userId, t)
      const { id: surveyId } = survey

      //create survey data schema
      await migrateSurveySchema(surveyId)

      if (createRootEntity) {
        // create survey's root entity
        const rootEntityDefProps = {
          name: 'root_entity',
          labels: { [lang]: 'Root entity' },
          multiple: false,
          [nodeDefLayoutProps.pageUuid]: uuidv4(),
          [nodeDefLayoutProps.render]: nodeDefRenderType.form,
        }

        await NodeDefManager.createEntityDef(user, surveyId, null, uuidv4(), rootEntityDefProps, t)
      }

      // update user prefs
      await UserRepository.updateUserPref(user, userPrefNames.survey, surveyId, t)

      // create default groups for this survey

      survey.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, Survey.getDefaultAuthGroups(lang), t)

      if (!AuthManager.isSystemAdmin(user)) {
        await AuthGroupRepository.insertUserGroup(Survey.getSurveyAdminGroup(survey).id, userId, t)
      }

      await ActivityLog.log(user, surveyId, ActivityLog.type.surveyCreate, { name, label, lang, uuid: survey.uuid }, t)

      return survey
    }
  )

  return assocSurveyInfo(survey)
}

// ====== READ
const fetchSurveyById = async (surveyId, draft = false, validate = false, client = db) => {
  const surveyInfo = await SurveyRepository.getSurveyById(surveyId, draft, client)
  const authGroups = await AuthGroupRepository.fetchSurveyGroups(surveyInfo.id, client)
  const validation = validate ? await SurveyValidator.validateSurveyInfo(surveyInfo) : null

  const info = { ...surveyInfo, authGroups, validation }
  return assocSurveyInfo(info)
}

const fetchSurveyAndNodeDefsBySurveyId = async (id, draft = false, advanced = false, validate = false, client = db) => {
  const survey = await fetchSurveyById(id, draft, validate, client)
  const nodeDefs = await NodeDefManager.fetchNodeDefsBySurveyId(id, draft, advanced, validate, client)
  return Survey.assocNodeDefs(nodeDefs)(survey)
}

const fetchUserSurveysInfo = async (user) => R.map(
  assocSurveyInfo,
  await SurveyRepository.fetchSurveys(user, !AuthManager.isSystemAdmin(user))
)

// ====== UPDATE
const updateSurveyProp = async (user, surveyId, key, value, client = db) =>
  await client.tx(async t => {
    await ActivityLog.log(user, surveyId, ActivityLog.type.surveyPropUpdate, { key, value }, t)
    await SurveyRepository.updateSurveyProp(surveyId, key, value, t)

    return await fetchSurveyById(surveyId, true, true, t)
  })

// ====== DELETE
const deleteSurvey = async (id, user) => {
  await db.tx(async t => {

    const userPrefSurveyId = getUserPrefSurveyId(user)
    if (userPrefSurveyId === id)
      await UserRepository.deleteUserPref(user, userPrefNames.survey, t)

    await SurveyRepository.dropSurveySchema(id, t)
    await SurveyRdbManager.dropSchema(id, t)

    await SurveyRepository.deleteSurvey(id, t)
  })
}

module.exports = {
  // ====== CREATE
  createSurvey,

  // ====== READ
  fetchAllSurveyIds: SurveyRepository.fetchAllSurveyIds,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  fetchUserSurveysInfo,
  fetchDependencies: SurveyRepository.fetchDependencies,

  // ====== UPDATE
  updateSurveyProp,
  publishSurveyProps: SurveyRepository.publishSurveyProps,
  updateSurveyDependencyGraphs: SurveyRepository.updateSurveyDependencyGraphs,

  // ====== DELETE
  deleteSurvey,
  deleteSurveyLabel: SurveyRepository.deleteSurveyLabel,
  deleteSurveyDescription: SurveyRepository.deleteSurveyDescription,
  dropSurveySchema: SurveyRepository.dropSurveySchema,
}