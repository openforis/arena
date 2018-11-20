const R = require('ramda')

const Job = require('../../job/job')

const Taxonomy = require('../../../common/survey/taxonomy')
const {isValid, getInvalidFieldValidations} = require('../../../common/validation/validator')

const TaxonomyManager = require('../../taxonomy/taxonomyManager')

class TaxonomiesValidationJob extends Job {
  constructor (params) {
    super(TaxonomiesValidationJob.type, params)
  }

  async execute () {
    const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(this.surveyId, true, true)

    const invalidTaxonomies = R.filter(taxonomy => !isValid(taxonomy), taxonomies)

    if (R.isEmpty(invalidTaxonomies)) {
      this.setStatusSucceeded()
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

TaxonomiesValidationJob.type = 'TaxonomiesValidationJob'

module.exports = TaxonomiesValidationJob