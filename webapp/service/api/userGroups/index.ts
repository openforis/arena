import axios from 'axios'
import { UserGroup } from '@openforis/arena-core'

type UserGroupMember = Record<string, unknown>

const getUserGroupsApiPath = (surveyId: string): string => `/api/survey/${surveyId}/user-groups`
const getUserGroupApiPath = ({ surveyId, groupUuid }: { surveyId: string; groupUuid: string }): string =>
  `${getUserGroupsApiPath(surveyId)}/${groupUuid}`

// READ
export const fetchUserGroups = async ({ surveyId }: { surveyId: string }): Promise<UserGroup[]> => {
  const {
    data: { list },
  } = await axios.get(getUserGroupsApiPath(surveyId))
  return list
}

export const fetchUserGroup = async ({
  surveyId,
  groupUuid,
}: {
  surveyId: string
  groupUuid: string
}): Promise<UserGroup> => {
  const { data: userGroup } = await axios.get(getUserGroupApiPath({ surveyId, groupUuid }))
  return userGroup
}

export const fetchUserGroupMembers = async ({
  surveyId,
  groupUuid,
}: {
  surveyId: string
  groupUuid: string
}): Promise<UserGroupMember[]> => {
  const {
    data: { list },
  } = await axios.get(`${getUserGroupApiPath({ surveyId, groupUuid })}/members`)
  return list
}

// CREATE
export const createUserGroup = async ({
  surveyId,
  props,
}: {
  surveyId: string
  props: Record<string, unknown>
}): Promise<UserGroup> => {
  const { data: userGroup } = await axios.post(getUserGroupsApiPath(surveyId), { props })
  return userGroup
}

// UPDATE
export const updateUserGroup = async ({
  surveyId,
  groupUuid,
  props,
}: {
  surveyId: string
  groupUuid: string
  props: Record<string, unknown>
}): Promise<UserGroup> => {
  const { data: userGroup } = await axios.put(getUserGroupApiPath({ surveyId, groupUuid }), { props })
  return userGroup
}

// DELETE
export const deleteUserGroup = async ({
  surveyId,
  groupUuid,
}: {
  surveyId: string
  groupUuid: string
}): Promise<UserGroup> => {
  const { data: userGroup } = await axios.delete(getUserGroupApiPath({ surveyId, groupUuid }))
  return userGroup
}

// MEMBERS
export const addUserGroupMember = async ({
  surveyId,
  groupUuid,
  userUuid,
}: {
  surveyId: string
  groupUuid: string
  userUuid: string
}): Promise<void> => {
  await axios.post(`${getUserGroupApiPath({ surveyId, groupUuid })}/members`, { userUuid })
}

export const removeUserGroupMember = async ({
  surveyId,
  groupUuid,
  userUuid,
}: {
  surveyId: string
  groupUuid: string
  userUuid: string
}): Promise<void> => {
  await axios.delete(`${getUserGroupApiPath({ surveyId, groupUuid })}/members/${userUuid}`)
}
