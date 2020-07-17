import axios from 'axios'

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
