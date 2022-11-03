import axios from 'axios'

import * as A from '@core/arena'

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

export const fetchTaxonomy = async ({ surveyId, taxonomyUuid, draft = true, validate = true }) => {
  const {
    data: { taxonomy },
  } = await axios.get(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}`, {
    params: { draft, validate },
  })
  return taxonomy
}

// ==== CREATE
export const createTaxonomy = async ({ surveyId }) => {
  const {
    data: { taxonomy },
  } = await axios.post(`/api/survey/${surveyId}/taxonomies`, Taxonomy.newTaxonomy())

  return taxonomy
}

export const uploadTaxa = async ({ surveyId, taxonomyUuid, formData }) =>
  axios.post(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/upload`, formData)

//  ==== UPDATE
export const updateTaxonomy = async ({ surveyId, taxonomyUuid, data }) =>
  axios.put(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}`, data)

export const updateTaxonomyExtraPropDef = async ({
  surveyId,
  taxonomyUuid,
  propName,
  extraPropDef,
  deleted = false,
}) => {
  const {
    data: { taxonomy },
  } = await axios.put(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}/extradef`, {
    propName,
    itemExtraDef: A.stringify(extraPropDef),
    deleted,
  })
  return taxonomy
}

export const deleteTaxonomyIfEmpty = async ({ surveyId, taxonomyUuid }) => {
  const {
    data: { taxonomies: updatedTaxonomies },
  } = await axios.delete(`/api/survey/${surveyId}/taxonomies/${taxonomyUuid}`, { data: { onlyIfEmpty: true } })
  const deleted = !updatedTaxonomies[taxonomyUuid]
  return deleted
}
