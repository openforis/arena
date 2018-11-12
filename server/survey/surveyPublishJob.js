const R = require('ramda')

const db = require('../db/db')

const {Job} = require('../job/job')

const CodeList = require('../../common/survey/codeList')
const Taxonomy = require('../../common/survey/taxonomy')
const NodeDef = require('../../common/survey/nodeDef')
const {isValid, getInvalidFieldValidations} = require('../../common/validation/validator')

const {validateNodeDefs} = require('../nodeDef/nodeDefValidator')
const NodeDefRepository = require('../nodeDef/nodeDefRepository')
const SurveyRepository = require('../survey/surveyRepository')
const CodeListManager = require('../codeList/codeListManager')
const TaxonomyManager = require('../taxonomy/taxonomyManager')

class NodeDefsValidationJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'node definitions validation')
  }

  async execute () {
    const nodeDefsDB = await NodeDefRepository.fetchNodeDefsBySurveyId(this.surveyId, true)

    const validatedNodeDefs = await validateNodeDefs(nodeDefsDB)
    const invalidNodeDefs = R.filter(nodeDef => !isValid(nodeDef), validatedNodeDefs)

    if (R.isEmpty(invalidNodeDefs)) {
      this.setStatusCompleted()
    } else {
      this.errors = R.reduce((acc, nodeDef) => R.assoc(NodeDef.getNodeDefName(nodeDef), getInvalidFieldValidations(nodeDef.validation), acc), {}, invalidNodeDefs)
      this.setStatusFailed()
    }
  }
}

class CodeListsValidationJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'code lists validation')
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
      this.setStatusCompleted()
    } else {
      this.setStatusFailed()
    }
  }
}

class TaxonomiesValidationJob extends Job {
  constructor (userId, surveyId) {
    super(userId, surveyId, 'taxonomies validation')
  }

  async execute () {
    const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(this.surveyId, true, true)

    const invalidTaxonomies = R.filter(taxonomy => !isValid(taxonomy.validation), taxonomies)

    if (R.isEmpty(invalidTaxonomies)) {
      this.setStatusCompleted()
    } else {
      this.errors = R.reduce(
        (acc, taxonomy) => R.assoc(Taxonomy.getTaxonomyName(taxonomy), getInvalidFieldValidations(taxonomy.validation), acc),
        {},
        invalidTaxonomies
      )
      this.setStatusFailed()
    }
  }
}

class PublishPropsJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'publish survey attributes')
  }

  async execute () {
    const id = this.surveyId
    await db.tx(async t => {
      await NodeDefRepository.publishNodeDefsProps(id, t)

      await NodeDefRepository.permanentlyDeleteNodeDefs(id, t)

      await CodeListManager.publishCodeListsProps(id, t)

      await TaxonomyManager.publishTaxonomiesProps(id, t)

      await SurveyRepository.publishSurveyProps(id, t)

      this.setStatusCompleted()
    })
  }
}

class SurveyPublishJob extends Job {

  constructor (userId, surveyId) {
    super(userId, surveyId, 'survey publish', [
      new NodeDefsValidationJob(userId, surveyId),
      new CodeListsValidationJob(userId, surveyId),
      new TaxonomiesValidationJob(userId, surveyId),
      new PublishPropsJob(userId, surveyId),
    ])
  }
}

module.exports = SurveyPublishJob