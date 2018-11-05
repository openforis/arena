const Promise = require('bluebird')
const R = require('ramda')
const db = require('../db/db')

const {publishSurveySchemaTableProps, markSurveyDraft} = require('../survey/surveySchemaRepositoryUtils')
const {toIndexedObj} = require('../../common/survey/surveyUtils')
const codeListRepository = require('../codeList/codeListRepository')
const codeListValidator = require('../codeList/codeListValidator')
const CodeList = require('../../common/survey/codeList')

// ====== VALIDATION
const assocCodeListValidation = async (codeList, codeListsWithLevels, codeListItems) => ({
  ...codeList,
  validation: await codeListValidator.validateCodeList(codeListsWithLevels, codeList, codeListItems)
})

const validateCodeList = async (surveyId, codeLists, codeList, draft) => {
  const codeListItems = await codeListRepository.fetchCodeListItemsByCodeListId(surveyId, codeList.id, draft)
  return await assocCodeListValidation(codeList, codeLists, codeListItems)
}

// ====== CREATE

const insertCodeList = async (surveyId, codeList) =>
  db.tx(async t => {
    const insertedCodeList = await codeListRepository.insertCodeList(surveyId, codeList, t)
    const levels = CodeList.getCodeListLevelsArray(codeList)

    //insert levels
    const insertedLevels = await Promise.all(
      levels.map(async level =>
        await codeListRepository.insertCodeListLevel(surveyId, insertedCodeList.id, level, t)
      )
    )
    await markSurveyDraft(surveyId, t)

    return CodeList.assocCodeListLevelsArray(insertedLevels)(insertedCodeList)
  })

const insertCodeListLevel = async (surveyId, codeListId, level) =>
  db.tx(async t => {
    const insertedLevel = await codeListRepository.insertCodeListLevel(surveyId, codeListId, level, t)

    await markSurveyDraft(surveyId, t)

    return insertedLevel
  })

const insertCodeListItem = async (surveyId, item) =>
  db.tx(async t => {
    const insertedItem = await codeListRepository.insertCodeListItem(surveyId, item, t)

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

const fetchCodeListById = async (surveyId, codeListId, draft = false, validate = true) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)
  const codeList = R.find(R.propEq('id', codeListId))(codeListsWithLevels)

  return validate
    ? await validateCodeList(surveyId, codeListsWithLevels, codeList, draft)
    : codeList
}

const fetchCodeListsBySurveyId = async (surveyId, draft = false, validate = true) => {
  const codeListsWithLevels = await fetchCodeListsWithLevels(surveyId, draft)

  return validate
    ? await Promise.all(
      codeListsWithLevels.map(async codeList =>
        await validateCodeList(surveyId, codeListsWithLevels, codeList, draft)
      )
    )
    : codeListsWithLevels
}

const fetchCodeListItemsByCodeListId = async (surveyId, codeListId, draft = false) =>
  await codeListRepository.fetchCodeListItemsByCodeListId(surveyId, codeListId, draft)

const fetchCodeListItemsByParentId = async (surveyId, codeListId, parentId = null, draft = false) =>
  await codeListRepository.fetchCodeListItemsByParentId(surveyId, codeListId, parentId, draft)

const fetchCodeListItemsByAncestorCodes = async (surveyId, codeListId, ancestorCodes, draft = false) =>
  await codeListRepository.fetchCodeListItemsByAncestorCodes(surveyId, codeListId, ancestorCodes, draft)

// ====== UPDATE

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

    await markSurveyDraft(surveyId, t)

    return updatedItem
  })

// ====== DELETE
const deleteCodeList = async (surveyId, codeListId) =>
  db.tx(async t => {
    await codeListRepository.deleteCodeList(surveyId, codeListId, t)
    await markSurveyDraft(surveyId, t)
  })

const deleteCodeListLevel = async (surveyId, codeListLevelId) =>
  db.tx(async t => {
    await codeListRepository.deleteCodeListLevel(surveyId, codeListLevelId, t)
    await markSurveyDraft(surveyId, t)
  })

const deleteCodeListItem = async (surveyId, codeListItemId) =>
  db.tx(async t => {
    await codeListRepository.deleteCodeListItem(surveyId, codeListItemId, t)
    await markSurveyDraft(surveyId, t)
  })

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