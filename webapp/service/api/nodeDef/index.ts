import type { ArenaAnyNodeDef, ArenaNodeDefPropsAdvanced } from '@openforis/arena-core'
import axios from 'axios'

// ==== READ
export const fetchNodeDef = async ({ surveyId, nodeDefUuid }: { surveyId: number; nodeDefUuid: string }) => {
  const {
    data: { nodeDef },
  } = await axios.get(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, {})
  return nodeDef
}

export const fetchNodeDefs = async ({ surveyId, params }: { surveyId: number; params?: object }) => {
  const {
    data: { nodeDefs, nodeDefsValidation },
  } = await axios.get(`/api/survey/${surveyId}/nodeDefs`, { params })
  return { nodeDefs, nodeDefsValidation }
}

// ==== CREATE
export const putNodeDefProps = async ({
  surveyId,
  nodeDefUuid,
  parentUuid,
  cycle,
  props,
  propsAdvanced,
}: {
  surveyId: number
  nodeDefUuid: string
  parentUuid?: string | null
  cycle: string
  props?: object
  propsAdvanced?: ArenaNodeDefPropsAdvanced
}) => {
  const {
    data: { dependencyGraph, nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    parentUuid,
    cycle,
    props,
    propsAdvanced,
  })
  return { dependencyGraph, nodeDefsValidation, nodeDefsUpdated }
}

export const postNodeDef = async ({
  surveyId,
  surveyCycleKey,
  nodeDef,
}: {
  surveyId: number
  surveyCycleKey: string
  nodeDef: ArenaAnyNodeDef
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.post(`/api/survey/${surveyId}/nodeDef`, { surveyCycleKey, nodeDef })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const postNodeDefs = async ({
  surveyId,
  surveyCycleKey,
  nodeDefs,
}: {
  surveyId: number
  surveyCycleKey: string
  nodeDefs: ArenaAnyNodeDef[]
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.post(`/api/survey/${surveyId}/nodeDefs`, { surveyCycleKey, nodeDefs })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const deleteNodeDef = async ({
  surveyId,
  nodeDefUuid,
  surveyCycleKey,
}: {
  surveyId: number
  nodeDefUuid: string
  surveyCycleKey: string
}) => axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, { params: { surveyCycleKey } })

export const deleteNodeDefs = async ({
  surveyId,
  nodeDefUuids,
  surveyCycleKey,
}: {
  surveyId: number
  nodeDefUuids: string[]
  surveyCycleKey: string
}) => axios.delete(`/api/survey/${surveyId}/nodeDefs`, { params: { surveyCycleKey, nodeDefUuids } })

// ==== UPDATE
export const putNodeDefsProps = async ({
  surveyId,
  nodeDefs,
  cycle,
}: {
  surveyId: number
  nodeDefs: object[]
  cycle: string
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDefs/props`, {
    nodeDefs,
    cycle,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const moveNodeDef = async ({
  surveyId,
  nodeDefUuid,
  targetParentNodeDefUuid,
}: {
  surveyId: number
  nodeDefUuid: string
  targetParentNodeDefUuid: string
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/move`, {
    targetParentNodeDefUuid,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const convertNodeDef = async ({
  surveyId,
  nodeDefUuid,
  toType,
}: {
  surveyId: number
  nodeDefUuid: string
  toType: string
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/convert`, {
    toType,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}

export const cloneNodeDefFromSurvey = async ({
  surveyId,
  sourceSurveyId,
  sourceNodeDefUuid,
  targetParentNodeDefUuid,
}: {
  surveyId: number
  sourceSurveyId: number
  sourceNodeDefUuid: string
  targetParentNodeDefUuid: string
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated, categoriesCloned, taxonomiesCloned },
  } = await axios.post(`/api/survey/${surveyId}/nodeDef/clone-from-survey`, {
    sourceSurveyId,
    sourceNodeDefUuid,
    targetParentNodeDefUuid,
  })
  return { nodeDefsValidation, nodeDefsUpdated, categoriesCloned, taxonomiesCloned }
}

export const cloneNodeDef = async ({
  surveyId,
  nodeDefUuid,
  targetParentNodeDefUuid,
}: {
  surveyId: number
  nodeDefUuid: string
  targetParentNodeDefUuid: string
}) => {
  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.post(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/clone`, {
    targetParentNodeDefUuid,
  })
  return { nodeDefsValidation, nodeDefsUpdated }
}
