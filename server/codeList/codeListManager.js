const Promise = require('bluebird')
const R = require('ramda')
const db = require('../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')
const {toIndexedObj} = require('../../common/survey/surveyUtils')
const codeListRepository = require('../codeList/codeListRepository')
const codeListValidator = require('../codeList/codeListValidator')
const {
  getCodeListLevelsArray,
  assocCodeListLevelsArray,
} = require('../../common/survey/codeList')

// ====== CREATE

const insertCodeList = async (surveyId, codeList) =>
  db.tx(async t => {
    const insertedCodeList = await codeListRepository.insertCodeList(surveyId, codeList, t)
    const levels = getCodeListLevelsArray(codeList)

    //insert levels
    const insertedLevels = await Promise.all(
      levels.map(async level =>
        await codeListRepository.insertCodeListLevel(surveyId, insertedCodeList.id, level, t)
      )
    )
    await markSurveyDraft(surveyId, t)

    return assocCodeListLevelsArray(insertedLevels)(insertedCodeList)
  })

const insertCodeListLevel = async (surveyId, codeListId, level) =>
  db.tx(async t => {
    const insertedLevel = await codeListRepository.insertCodeListLevel(surveyId, codeListId, level, t)

    await markSurveyDraft(surveyId, t)

    return insertedLevel
  })

const insertCodeListItem = async (surveyId, item) =>
  db.tx(async t => {
    const insertedItem = await codeListRepository.insertCodeListItem(surveyId, item)

    await markSurveyDraft(surveyId, t)

    return insertedItem
  })

// ====== READ
const fetchCodeListsWithLevels = async (surveyId, draft) => {
  const codeListsDb = await codeListRepository.fetchCodeListsBySurveyId(surveyId, draft)

  return await Promise.all(
    codeListsDb.map(async codeList => ({
      ...codeList,
      levels: toIndexedObj(
        await codeListRepository.fetchCodeListLevelsByCodeListId(surveyId, codeList.id, draft),
        'index'
      ),
    }))
  )
}

const fetchCodeListById = async (surveyId, codeListId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)
  return R.find(R.propEq('id', codeListId))(codeListsWithLevels)
}

const fetchCodeListsBySurveyId = async (surveyId, draft) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)

  return await Promise.all(
    codeListsWithLevels.map(async codeList => {
      const codeListItems = await codeListRepository.fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
      return await assocCodeListValidation(codeList, codeListsWithLevels, codeListItems)
    })
  )
}

const fetchCodeListItemsByCodeListId = async (surveyId, codeListId, draft = false) =>
  await codeListRepository.fetchCodeListItemsByCodeListId(surveyId, codeListId, draft)

const fetchCodeListItemsByParentId = async (surveyId, codeListId, parentId = null, draft = false) =>
  await codeListRepository.fetchCodeListItemsByParentId(surveyId, codeListId, parentId, draft)

const fetchCodeListItemsByAncestorCodes = async (surveyId, codeListId, ancestorCodes, draft = false) =>
  await codeListRepository.fetchCodeListItemsByAncestorCodes(surveyId, codeListId, ancestorCodes, draft)

// ====== UPDATE

const assocCodeListValidation = async (codeList, codeListsWithLevels, codeListItems) => ({
  ...codeList,
  validation: await codeListValidator.validateCodeList(codeListsWithLevels, codeList, codeListItems)
})

const publishCodeListsProps = async (surveyId, client = db) => {
  await publishSurveySchemaTableProps(surveyId, 'code_list', client)

  await publishSurveySchemaTableProps(surveyId, 'code_list_level', client)

  await publishSurveySchemaTableProps(surveyId, 'code_list_item', client)
}

const updateCodeListProp = async (surveyId, codeListId, key, value) =>
  db.tx(async t => {
    const updatedCodeList = await codeListRepository.updateCodeListProp(surveyId, codeListId, key, value, t)

    await markSurveyDraft(surveyId, t)

    return updatedCodeList
  })

const updateCodeListLevelProp = async (surveyId, codeListLevelId, key, value) =>
  db.tx(async t => {
    const updatedLevel = await codeListRepository.updateCodeListLevelProp(surveyId, codeListLevelId, key, value, t)

    await markSurveyDraft(surveyId, t)

    return updatedLevel
  })

const updateCodeListItemProp = async (surveyId, codeListItemId, key, value) =>
  db.tx(async t => {
    const updatedItem = await codeListRepository.updateCodeListItemProp(surveyId, codeListItemId, key, value, t)

    await markSurveyDraft(surveyId)

    return updatedItem
  })

// ====== DELETE
const deleteCodeList = async (surveyId, codeListId) =>
  await codeListRepository.deleteCodeList(surveyId, codeListId)

const deleteCodeListLevel = async (surveyId, codeListLevelId) =>
  await codeListRepository.deleteCodeListLevel(surveyId, codeListLevelId)

const deleteCodeListItem = async (surveyId, codeListItemId) =>
  await codeListRepository.deleteCodeListItem(surveyId, codeListItemId)


module.exports = {

  //CREATE
  insertCodeList,
  insertCodeListLevel,
  insertCodeListItem,

  //READ
  fetchCodeListById,
  fetchCodeListsBySurveyId,
  fetchCodeListItemsByCodeListId,
  fetchCodeListItemsByParentId,
  fetchCodeListItemsByAncestorCodes,

  //UPDATE
  publishCodeListsProps,
  updateCodeListProp,
  updateCodeListLevelProp,
  updateCodeListItemProp,

  deleteCodeList,
  deleteCodeListLevel,
  deleteCodeListItem,
}