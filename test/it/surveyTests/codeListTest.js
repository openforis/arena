const {getContextSurveyId} = require('./../../testContext')
const {expect} = require('chai')

const CodeListManager = require('../../../server/category/categoryManager')
const CodeListTest = require('../../../common/survey/category')

const createCodeListTest = async () => {
  const surveyId = getContextSurveyId()

  const codeListReq = CodeListTest.newCategory({name: 'code_list_test'})

  const codeList = await CodeListManager.insertCodeList(surveyId, codeListReq)

  expect(codeList.id).to.exist

  const reloadedCodeList = await CodeListManager.fetchCategoryById(surveyId, codeList.id, true, false)

  expect(reloadedCodeList).to.deep.equal(codeList)
}

const createCodeListLevelTest = async () => {
  const surveyId = getContextSurveyId()

  const codeList = (await CodeListManager.fetchCodeListsBySurveyId(surveyId, true, false))[0]

  const levelReq = CodeListTest.newLevel(codeList)
  const level = await CodeListManager.insertCodeListLevel(surveyId, codeList.id, levelReq)

  expect(CodeListTest.getLevelName(level)).to.be.equal(CodeListTest.getLevelName(levelReq))

  //inserted level should be the 2nd
  expect(level.index).to.be.equal(1)

  const reloadedCodeList = await CodeListManager.fetchCategoryById(surveyId, codeList.id, true, false)

  //levels must be 2
  expect(CodeListTest.getLevelsArray(reloadedCodeList).length).to.be.equal(2)
}

const createCodeListItemTest = async () => {
  const surveyId = getContextSurveyId()

  const codeList = (await CodeListManager.fetchCodeListsBySurveyId(surveyId, true, false))[0]

  const level = CodeListTest.getLevelByIndex(0)(codeList)

  const itemCode = '1'
  const itemLabel = 'Value 1'

  const itemReq = CodeListTest.newItem(level.id, null, {code: itemCode, labels: {en: itemLabel}})

  const item = await CodeListManager.insertCodeListItem(surveyId, itemReq)

  expect(CodeListTest.getItemCode(item)).to.be.equal(itemCode)
  expect(CodeListTest.getItemLabel('en')(item)).to.be.equal(itemLabel)
}

const updateCodeListTest = async () => {
  const surveyId = getContextSurveyId()

  const codeList = (await CodeListManager.fetchCodeListsBySurveyId(surveyId, true, false))[0]

  const newName = 'code_list_modified'
  const updatedCodeList = await CodeListManager.updateCodeListProp(surveyId, codeList.id, 'name', newName)

  expect(CodeListTest.getName(updatedCodeList)).to.be.equal(newName)
}

module.exports = {
  //code list
  createCodeListTest,
  updateCodeListTest,

  //level
  createCodeListLevelTest,

  //item
  createCodeListItemTest,
}