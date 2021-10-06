import axios from 'axios'

// ==== READ
export const fetchNodeDef = async ({ surveyId, nodeDefUuid } = {}) => {
  const {
    data: { nodeDef },
  } = await axios.get(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, {})
  return nodeDef
}

export const fetchNodeDefs = async ({ surveyId, params } = {}) => {
  const {
    data: { nodeDefs, nodeDefsValidation },
  } = await axios.get(`/api/survey/${surveyId}/nodeDefs`, { params })
  return { nodeDefs, nodeDefsValidation }
}

// ==== CREATE
export const putNodeDefProps = async ({ surveyId, nodeDefUuid, parentUuid, cycle, props, propsAdvanced } = {}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    parentUuid,
    cycle,
    props,
    propsAdvanced,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const postNodeDef = async ({ surveyId, surveyCycleKey, nodeDef } = {}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.post(`/api/survey/${surveyId}/nodeDef`, { surveyCycleKey, nodeDef })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const deleteNodeDef = async ({ surveyId, nodeDefUuid, surveyCycleKey }) =>
  axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, { params: { surveyCycleKey } })
