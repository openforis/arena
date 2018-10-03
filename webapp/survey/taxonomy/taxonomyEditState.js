import * as R from 'ramda'

import {
  getSurveyTaxonomyByUUID
} from '../../../common/survey/survey'

const taxonomyEditPath = ['taxonomyEdit']

export const getTaxonomyEditTaxonomyUUID = () => R.path([taxonomyEditPath, 'uuid'])

export const getTaxonomyEditTaxonomy = survey =>
    state => R.pipe(
      getTaxonomyEditTaxonomyUUID,
      uuid => getSurveyTaxonomyByUUID(uuid)(survey),
    )(state)
