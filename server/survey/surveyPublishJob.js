const R = require('ramda')

const db = require('../db/db')

const {Job} = require('../job/job')

const CodeList = require('../../common/survey/codeList')
const NodeDef = require('../../common/survey/nodeDef')
const {jobStatus} = require('../../common/job/job')
const {isValid} = require('../../common/validation/validator')

const {validateNodeDefs} = require('../nodeDef/nodeDefValidator')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const SurveyRepository = require('../survey/surveyRepository')
const CodeListManager = require('../codeList/codeListManager')
const TaxonomyManager = require('../taxonomy/taxonomyManager')

class NodeDefsValidationJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'node definitions validation')
  }

  async process () {
    const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(this.surveyId, true)

    const validatedNodeDefs = await validateNodeDefs(nodeDefsDB)
    const invalidNodeDefs = R.filter(nodeDef => !isValid(nodeDef), validatedNodeDefs)

    if (R.isEmpty(invalidNodeDefs)) {
      this.changeStatus(jobStatus.completed)
    } else {
      this.errors = R.reduce((acc, nodeDef) => R.assoc(NodeDef.getNodeDefName(nodeDef), nodeDef.validation.fields, acc), {}, invalidNodeDefs)
      console.log(this.errors)
      this.changeStatus(jobStatus.failed)
    }
  }
}

class CodeListsValidationJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'code lists validation')
  }

  async process () {
    const codeLists = await CodeListManager.fetchCodeListsBySurveyId(this.surveyId, true)

    const invalidCodeLists = R.filter(codeList => !isValid(codeList.validation), codeLists)

    if (R.isEmpty(invalidCodeLists)) {
      this.changeStatus(jobStatus.completed)
    } else {
      this.errors = R.reduce(
        (acc, codeList) => R.assoc(CodeList.getCodeListName(codeList), codeList.validation.fields, acc),
        {},
        invalidCodeLists
      )
      this.changeStatus(jobStatus.failed)
    }
  }
}

class PublishPropsJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'publish survey attributes')
  }

  async process () {
    const id = this.surveyId
    await db.tx(async t => {
      await NodeDefRepository.publishNodeDefsProps(id, t)

      await NodeDefRepository.permanentlyDeleteNodeDefs(id, t)

      await CodeListManager.publishCodeListsProps(id, t)

      await TaxonomyManager.publishTaxonomiesProps(id, t)

      await SurveyRepository.publishSurveyProps(id, t)

      this.changeStatus(jobStatus.completed)
    })
  }
}

class SurveyPublishJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'survey publish', [
      new NodeDefsValidationJob(userId, surveyId),
      new CodeListsValidationJob(userId, surveyId),
      new PublishPropsJob(userId, surveyId),
    ])
  }
}

module.exports = SurveyPublishJob