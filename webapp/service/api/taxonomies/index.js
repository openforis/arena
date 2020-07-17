import axios from 'axios'

import * as Taxonomy from '@core/survey/taxonomy'

// ==== READ
export const fetchTaxonomies = async ({ surveyId, draft = true, validate = false, search = '' }) => {
  const {
    data: { list: taxonomies },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies`, {
    params: { draft, validate, search },
  })
  return taxonomies
}

export const fetchTaxonomy = async ({ surveyId, Uuid, draft = true, validate = true }) => {
  const {
    data: { taxonomy },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies/${Uuid}`, {
    params: { draft, validate },
  })
  return taxonomy
}

// CREATE
export const createTaxonomy = async ({ surveyId }) => {
  const {
    data: { taxonomy },
  } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  return taxonomy
}
