import * as R from 'ramda'

import {
  getSurveyTaxonomyByUUID
} from '../../../common/survey/survey'

// DOCS
const surveyState = {
  survey: {
    //....
    taxonomies: {
      uuid: {
        // taxonomy
        uuid: '',
        props: {},
      }
    },
    // loaded taxonomy
    taxonomyEdit: {
      uuid: '',
    },

  }
}

const taxonomyEditPath = ['taxonomyEdit']

export const getTaxonomyEditTaxonomyUUID = R.path([taxonomyEditPath, 'uuid'])

export const getTaxonomyEditTaxonomy = survey => R.pipe(
  getTaxonomyEditTaxonomyUUID,
  uuid => getSurveyTaxonomyByUUID(uuid)(survey),
)(survey)


// ========== UPDATE

export const updateTaxonomyEdit = (taxonomyUUID = null) =>
  taxonomyUUID
    ? R.assocPath(taxonomyEditPath, {uuid: taxonomyUUID})
    : R.dissocPath(taxonomyEditPath)
