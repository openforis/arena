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
      taxa: [],
      currentPage: 0,
      totalPages: 0,
    },

  }
}

const taxonomyEditPath = ['taxonomyEdit']

const getTaxonomyEdit = R.path(taxonomyEditPath)

export const getTaxonomyEditTaxonomyUUID = R.path(R.append('uuid', taxonomyEditPath))

export const getTaxonomyEditTaxonomy = survey => R.pipe(
  getTaxonomyEditTaxonomyUUID,
  uuid => getSurveyTaxonomyByUUID(uuid)(survey),
)(survey)

export const getTaxonomyEditImportingFile = R.pathOr(false, R.append('importingFile', taxonomyEditPath))

export const getTaxonomyEditTaxaCurrentPage = R.pathOr(1, R.append('taxaCurrentPage', taxonomyEditPath))

export const getTaxonomyEditTaxaTotalPages = R.pathOr(0, R.append('taxaTotalPages', taxonomyEditPath))

export const getTaxonomyEditTaxa = R.pathOr([], R.append('taxa', taxonomyEditPath))

// ========== UPDATE

export const updateTaxonomyEdit = props => state => {
  if (R.has('uuid')(props) && R.isNil(R.prop('uuid')(props))) {
    return R.dissocPath(taxonomyEditPath)(state)
  } else {
    return R.pipe(
      getTaxonomyEdit,
      R.merge(props),
      taxonomyEdit => R.assocPath(taxonomyEditPath, taxonomyEdit)(state),
    )(state)
  }
}