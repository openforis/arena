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
      importingFile: false,
    },

  }
}

const taxonomyEditPath = ['taxonomyEdit']

export const getTaxonomyEditTaxonomyUUID = R.path(R.append('uuid', taxonomyEditPath))

export const getTaxonomyEditTaxonomy = survey => R.pipe(
  getTaxonomyEditTaxonomyUUID,
  uuid => getSurveyTaxonomyByUUID(uuid)(survey),
)(survey)

export const getTaxonomyEditImportingFile = R.path(R.append('importingFile', taxonomyEditPath))

// ========== UPDATE

export const updateTaxonomyEdit = (taxonomyUUID = null) =>
  taxonomyUUID
    ? R.assocPath(taxonomyEditPath, {uuid: taxonomyUUID})
    : R.dissocPath(taxonomyEditPath)
