const R = require('ramda')

const Job = require('../../job/job')

const CodeList = require('../../../common/survey/codeList')
const {isValid, getInvalidFieldValidations} = require('../../../common/validation/validator')

const CodeListManager = require('../../codeList/codeListManager')

class CodeListsValidationJob extends Job {

  constructor (userId, surveyId) {
    super('code-lists-validation', userId, surveyId)
  }

  async execute () {
    const codeLists = await CodeListManager.fetchCodeListsBySurveyId(this.surveyId, true, false)

    this.total = codeLists.length

    for (const codeList of codeLists) {
      const validatedCodeList = await CodeListManager.validateCodeList(this.surveyId, codeLists, codeList, true)
      if (!isValid(validatedCodeList)) {
        this.errors[CodeList.getCodeListName(validatedCodeList)] = getInvalidFieldValidations(validatedCodeList.validation)
      }
      this.incrementProcessedItems()
    }
    if (R.isEmpty(this.errors)) {
      this.setStatusSucceeded()
    } else {
      this.setStatusFailed()
    }
  }
}

module.exports = CodeListsValidationJob