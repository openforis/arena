import axios from 'axios'

const getUserGroupsApiPath = (surveyId) => `/api/survey/${surveyId}/user-groups`
const getUserGroupApiPath = ({ surveyId, groupUuid }) => `${getUserGroupsApiPath(surveyId)}/${groupUuid}`

// READ
export const fetchUserGroups = async ({ surveyId }) => {
  const {
    data: { list },
  } = await axios.get(getUserGroupsApiPath(surveyId))
  return list
}

export const fetchUserGroup = async ({ surveyId, groupUuid }) => {
  const { data: userGroup } = await axios.get(getUserGroupApiPath({ surveyId, groupUuid }))
  return userGroup
}

export const fetchUserGroupMembers = async ({ surveyId, groupUuid }) => {
  const {
    data: { list },
  } = await axios.get(`${getUserGroupApiPath({ surveyId, groupUuid })}/members`)
  return list
}

// CREATE
export const createUserGroup = async ({ surveyId, props }) => {
  const { data: userGroup } = await axios.post(getUserGroupsApiPath(surveyId), { props })
  return userGroup
}

// UPDATE
export const updateUserGroup = async ({ surveyId, groupUuid, props }) => {
  const { data: userGroup } = await axios.put(getUserGroupApiPath({ surveyId, groupUuid }), { props })
  return userGroup
}

// DELETE
export const deleteUserGroup = async ({ surveyId, groupUuid }) => {
  const { data: userGroup } = await axios.delete(getUserGroupApiPath({ surveyId, groupUuid }))
  return userGroup
}

// MEMBERS
export const addUserGroupMember = async ({ surveyId, groupUuid, userUuid }) => {
  await axios.post(`${getUserGroupApiPath({ surveyId, groupUuid })}/members`, { userUuid })
}

export const removeUserGroupMember = async ({ surveyId, groupUuid, userUuid }) => {
  await axios.delete(`${getUserGroupApiPath({ surveyId, groupUuid })}/members/${userUuid}`)
}
