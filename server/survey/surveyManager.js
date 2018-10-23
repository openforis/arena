const Promise = require('bluebird')
const R = require('ramda')
const db = require('../db/db')
const {migrateSurveySchema} = require('../db/migration/survey/execMigrations')
const {uuidv4} = require('../../common/uuid')

const {
  toIndexedObj,
  toUUIDIndexedObj,
} = require('../../common/survey/surveyUtils')

const surveyRepository = require('../survey/surveyRepository')
const {defaultSteps} = require('../../common/survey/survey')
const {validateSurvey} = require('../survey/surveyValidator')

const {createEntityDef} = require('../nodeDef/nodeDefRepository')
const {
  nodeDefLayoutProps,
  nodeDefRenderType,
} = require('../../common/survey/nodeDefLayout')

const {
  fetchCodeListsBySurveyId,
  fetchCodeListLevelsByCodeListId,
  fetchCodeListItemsByCodeListId,
} = require('../codeList/codeListRepository')
const {
  validateCodeListProps: codeListValidatorProps,
  validateCodeList,
} = require('../codeList/codeListValidator')
const {fetchTaxonomiesBySurveyId} = require('../taxonomy/taxonomyManager')

const {deleteUserPref, updateUserPref} = require('../user/userRepository')
const {getUserPrefSurveyId, userPrefNames} = require('../../common/user/userPrefs')

/**
 * ===== CODE LIST
 */
const fetchCodeListsWithLevels = async (surveyId, draft) => {
  const codeListsDb = await fetchCodeListsBySurveyId(surveyId, draft)

  return await Promise.all(
    codeListsDb.map(async codeList => ({
      ...codeList,
      levels: toIndexedObj(await fetchCodeListLevelsByCodeListId(surveyId, codeList.id, draft), 'index'),
    }))
  )
}

const assocCodeListValidation = async (codeList, codeListsWithLevels, codeListItems) => ({
  ...codeList,
  validation: await validateCodeList(codeListsWithLevels, codeList, codeListItems)
})

const fetchCodeListById = async (surveyId, codeListId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)
  return R.find(R.propEq('id', codeListId))(codeListsWithLevels)
}

const fetchCodeLists = async (surveyId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)

  return await Promise.all(
    codeListsWithLevels.map(async codeList => {
      const codeListItems = await fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
      return await assocCodeListValidation(codeList, codeListsWithLevels, codeListItems)
    })
  )
}

const validateCodeListProps = async (surveyId, codeListId) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, true)
  const codeList = R.find(R.propEq('id', codeListId))(codeListsWithLevels)
  return await codeListValidatorProps(codeListsWithLevels, codeList)
}

/**
 * ===== SURVEY
 */

// ====== CREATE
const createSurvey = async (user, {name, label, lang}) => db.tx(
  async t => {
    const props = {
      name,
      labels: {[lang]: label},
      languages: [lang],
      srs: ['4326'], //EPSG:4326 WGS84 Lat Lon Spatial Reference System,
      steps: {...defaultSteps},
    }

    const survey = await surveyRepository.insertSurvey(props, user.id, t)
    const {id: surveyId} = survey

    const rootEntityDefProps = {
      name: 'root_entity',
      labels: {[lang]: 'Root entity'},
      multiple: false,
      [nodeDefLayoutProps.pageUUID]: uuidv4(),
      [nodeDefLayoutProps.render]: nodeDefRenderType.form,
    }
    await createEntityDef(surveyId, null, uuidv4(), rootEntityDefProps, t)

    //create survey data schema
    migrateSurveySchema(surveyId)

    // update user prefs
    await updateUserPref(user, userPrefNames.survey, surveyId, t)

    return survey
  }
)

// ====== READ
const fetchSurveyById = async (id, draft) => {
  const survey = await surveyRepository.getSurveyById(id, draft)
  const codeLists = await fetchCodeLists(id, draft)
  const taxonomies = await fetchTaxonomiesBySurveyId(id, draft)

  return {
    ...survey,
    codeLists: toUUIDIndexedObj(codeLists),
    taxonomies: toUUIDIndexedObj(taxonomies),
    validation: await validateSurvey(survey),
  }
}

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
  // ====== DELETE
  deleteSurvey,

  fetchCodeListById,
  validateCodeListProps,
}