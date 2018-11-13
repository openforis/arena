const R = require('ramda')

const db = require('../db/db')
const {migrateSurveySchema} = require('../db/migration/dbMigrator')
const {uuidv4} = require('../../common/uuid')

const {toUUIDIndexedObj} = require('../../common/survey/surveyUtils')

const surveyRepository = require('../survey/surveyRepository')
const Survey = require('../../common/survey/survey')
const SurveyPublishJob = require('../survey/surveyPublishJob')
const {validateSurvey} = require('../survey/surveyValidator')

const nodeDefRepository = require('../nodeDef/nodeDefRepository')
const {validateNodeDefs} = require('../nodeDef/nodeDefValidator')
const {nodeDefLayoutProps, nodeDefRenderType,} = require('../../common/survey/nodeDefLayout')

const {deleteUserPref, updateUserPref} = require('../user/userRepository')
const {getUserPrefSurveyId, userPrefNames} = require('../../common/user/userPrefs')

const {getDefaultSurveyGroups} = require('../group/groupUtils')
const {createGroup, addUserToGroup, addSurveyToGroup} = require('../group/groupRepository')

const JobManager = require('../job/jobManager')

const assocSurveyInfo = info => ({info})

// ====== CREATE
const createSurvey = async (user, {name, label, lang}) => {

  const survey = await db.tx(
    async t => {
      const props = {
        name,
        labels: {[lang]: label},
        languages: [lang],
        srs: [{code: '4326', name: 'GCS WGS 1984'}], //EPSG:4326 WGS84 Lat Lon Spatial Reference System,
        steps: {...Survey.defaultSteps},
      }

      const userId = user.id

      // create the survey
      const survey = await surveyRepository.insertSurvey(props, userId, t)
      const {id: surveyId} = survey

      // create default groups
      getDefaultSurveyGroups(Survey.getName(survey), lang)
        .forEach(async (defaultGroup) => {
          const {labels, descriptions, role, dataCondition} = defaultGroup
          const {id: groupId} = await createGroup(labels, descriptions, role, dataCondition, t)

          if (role === 'surveyAdmin') {
            // TODO don't insert if the user belong to system administrators
            await addUserToGroup(groupId, userId, t)
          }
          addSurveyToGroup(groupId, surveyId, t)
        })

      // create survey's root entity props
      const rootEntityDefProps = {
        name: 'root_entity',
        labels: {[lang]: 'Root entity'},
        multiple: false,
        [nodeDefLayoutProps.pageUUID]: uuidv4(),
        [nodeDefLayoutProps.render]: nodeDefRenderType.form,
      }
      await nodeDefRepository.createEntityDef(surveyId, null, uuidv4(), rootEntityDefProps, t)

      // update user prefs
      await updateUserPref(user, userPrefNames.survey, surveyId, t)

      return survey
    }
  )

  //create survey data schema
  await migrateSurveySchema(survey.id)

  return assocSurveyInfo(survey)
}

// ====== READ
const fetchSurveyById = async (id, draft = false, validate = false) => {
  const survey = await surveyRepository.getSurveyById(id, draft)
  // const codeLists = await fetchCodeListsBySurveyId(id, draft)
  // const taxonomies = await fetchTaxonomiesBySurveyId(id, draft)

  return assocSurveyInfo({
    ...survey,
    // codeLists: toUUIDIndexedObj(codeLists),
    // taxonomies: toUUIDIndexedObj(taxonomies),
    validation: validate ? await validateSurvey(survey) : null
  })
}

const fetchUserSurveys = async (user) => R.map(
  assocSurveyInfo,
  await surveyRepository.fetchSurveys()
)

const fetchSurveyNodeDefs = async (surveyId, draft = false, validate = false) => {
  const nodeDefsDB = await nodeDefRepository.fetchNodeDefsBySurveyId(surveyId, draft)

  const nodeDefsResult = R.reduce(
    (acc, nodeDef) => draft
      ? R.append(nodeDef, acc)
      // remove draft and unpublished nodeDef
      : nodeDef.draft && !nodeDef.published
        ? acc
        : R.append(nodeDef, acc),
    [],
    nodeDefsDB
  )
  const nodeDefs = validate
    ? await validateNodeDefs(nodeDefsResult)
    : nodeDefsResult

  return toUUIDIndexedObj(nodeDefs)
}

// ====== UPATE
const updateSurveyProp = async (id, key, value, user) =>
  assocSurveyInfo(
    await surveyRepository.updateSurveyProp(id, key, value)
  )

const publishSurvey = async (id, user) =>
  await JobManager.startJob(new SurveyPublishJob(user.id, id))

// ====== DELETE
const deleteSurvey = async (id, user) => {
  await db.tx(async t => {

    const userPrefSurveyId = getUserPrefSurveyId(user)
    if (userPrefSurveyId === id)
      await deleteUserPref(user, userPrefNames.survey, t)

    await surveyRepository.deleteSurvey(id, t)
  })
}

module.exports = {
  // ====== CREATE
  createSurvey,

  // ====== READ
  fetchSurveyById,
  fetchUserSurveys,
  fetchSurveyNodeDefs,

  // ====== UPDATE
  updateSurveyProp,
  publishSurvey,

// ====== DELETE
  deleteSurvey,
}
