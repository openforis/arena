import * as R from 'ramda'

import Job from '../../../../../job/job'

import Taxonomy from '../../../../../../core/survey/taxonomy'
import Validation from '../../../../../../core/validation/validation'

import TaxonomyManager from '../../../../taxonomy/manager/taxonomyManager'
import { IValidation } from '../../../../../../core/survey/survey'

interface ITaxonomy {
  validation: IValidation;
}

export default class TaxonomiesValidationJob extends Job {
  static type: string = 'TaxonomiesValidationJob'

  constructor (params?) {
    super(TaxonomiesValidationJob.type, params)
  }

  async execute (tx) {
    const taxonomies = await TaxonomyManager.fetchTaxonomiesBySurveyId(this.surveyId, true, true, tx)

    const invalidTaxonomies = R.reject(Validation.isObjValid)(taxonomies) as ITaxonomy[]

    if (!R.isEmpty(invalidTaxonomies)) {
      this.errors = R.reduce(
        (acc, taxonomy: ITaxonomy) => R.assoc(Taxonomy.getName(taxonomy), Validation.getFieldValidations(taxonomy.validation), acc),
        {},
        invalidTaxonomies
      )
      await this.setStatusFailed()
    }
  }
}
