import * as R from 'ramda'

import Job from '@server/job/job'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Validation from '@core/validation/validation'

import * as TaxonomyManager from '../../../../taxonomy/manager/taxonomyManager'

export default class TaxonomiesValidationJob extends Job {
  constructor(params) {
    super(TaxonomiesValidationJob.type, params)
  }

  async execute() {
    const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(
      { surveyId: this.surveyId, draft: true, validate: true },
      this.tx
    )

    const invalidTaxonomies = R.reject(Validation.isObjValid)(taxonomies)

    if (!R.isEmpty(invalidTaxonomies)) {
      this.errors = R.reduce(
        (acc, taxonomy) =>
          R.assoc(Taxonomy.getName(taxonomy), Validation.getFieldValidations(taxonomy.validation), acc),
        {},
        invalidTaxonomies
      )
      await this.setStatusFailed()
    }
  }
}

TaxonomiesValidationJob.type = 'TaxonomiesValidationJob'
