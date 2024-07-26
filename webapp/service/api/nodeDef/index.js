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

export const postNodeDefs = async ({ surveyId, surveyCycleKey, nodeDefs } = {}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.post(`/api/survey/${surveyId}/nodeDefs`, { surveyCycleKey, nodeDefs })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const deleteNodeDef = async ({ surveyId, nodeDefUuid, surveyCycleKey }) =>
  axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, { params: { surveyCycleKey } })

export const deleteNodeDefs = async ({ surveyId, nodeDefUuids, surveyCycleKey }) =>
  axios.delete(`/api/survey/${surveyId}/nodeDefs`, { params: { surveyCycleKey, nodeDefUuids } })

// ==== UPDATE
export const putNodeDefsProps = async ({ surveyId, nodeDefs, cycle }) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDefs/props`, {
    nodeDefs,
    cycle,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const moveNodeDef = async ({ surveyId, nodeDefUuid, targetParentNodeDefUuid }) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/move`, {
    targetParentNodeDefUuid,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const convertNodeDef = async ({ surveyId, nodeDefUuid, toType }) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/convert`, {
    toType,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}
