import { useEffect, useState } from 'react'
import axios from 'axios'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'

import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyInfo, useSurveyPreferredLang } from '@webapp/store/survey'

interface SurveyUsersResponse {
  list: Record<string, unknown>[]
}

export interface UserGroupTableRow {
  id: string
  groupUuid: string
  groupName: string
  groupLabel: string
  qualifiers: string
  memberUuid: string | null
  memberName: string
  memberEmail: string
  memberRole: string
  memberStatus: string
}

interface UseUserGroupsTableResult {
  rows: UserGroupTableRow[]
  loading: boolean
}

const EMPTY_MEMBER_KEY = 'empty'

type UsersByUuid = Record<string, Record<string, unknown>>

interface GroupInfo {
  groupUuid: string
  groupName: string
  groupLabel: string
  qualifiers: string
}

const fetchUsersByUuid = async (surveyId: string): Promise<UsersByUuid> => {
  const { data: usersRes } = await axios.get<SurveyUsersResponse>(`/api/survey/${surveyId}/users`)
  const usersByUuid: UsersByUuid = {}
  usersRes.list.forEach((user) => {
    usersByUuid[User.getUuid(user) as string] = user
  })
  return usersByUuid
}

const getGroupInfo = (group: UserGroupType, preferredLang: string): GroupInfo => ({
  groupUuid: UserGroup.getUuid(group) as string,
  groupName: UserGroup.getName(group),
  groupLabel: UserGroup.getLabel(preferredLang)(group),
  qualifiers: UserGroup.getQualifiers(group)
    .map((qualifier) => `${UserGroupQualifier.getName(qualifier)}=${UserGroupQualifier.getValue(qualifier)}`)
    .join(', '),
})

const buildEmptyMemberRow = (groupInfo: GroupInfo): UserGroupTableRow => ({
  ...groupInfo,
  id: `${groupInfo.groupUuid}-${EMPTY_MEMBER_KEY}`,
  memberUuid: null,
  memberName: '',
  memberEmail: '',
  memberRole: '',
  memberStatus: '',
})

// The members endpoint only returns {uuid, name, email}; look up the full survey user record
// (fetched separately) to read role and status, avoiding a per-member API call.
const buildMemberRow = (params: {
  groupInfo: GroupInfo
  member: Record<string, unknown>
  usersByUuid: UsersByUuid
  surveyUuid: string
}): UserGroupTableRow => {
  const { groupInfo, member, usersByUuid, surveyUuid } = params
  const memberUuid = member.uuid as string
  const fullUser = usersByUuid[memberUuid]
  const authGroup = fullUser ? User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(fullUser) : null

  return {
    ...groupInfo,
    id: `${groupInfo.groupUuid}-${memberUuid}`,
    memberUuid,
    memberName: (member.name as string) ?? '',
    memberEmail: (member.email as string) ?? '',
    memberRole: authGroup ? AuthGroup.getName(authGroup) : '',
    memberStatus: fullUser ? ((User.getStatus(fullUser) as string) ?? '') : '',
  }
}

const buildGroupRows = (params: {
  group: UserGroupType
  members: Record<string, unknown>[]
  usersByUuid: UsersByUuid
  surveyUuid: string
  preferredLang: string
}): UserGroupTableRow[] => {
  const { group, members, usersByUuid, surveyUuid, preferredLang } = params
  const groupInfo = getGroupInfo(group, preferredLang)

  if (members.length === 0) return [buildEmptyMemberRow(groupInfo)]

  return members.map((member) => buildMemberRow({ groupInfo, member, usersByUuid, surveyUuid }))
}

const fetchUserGroupsTableRows = async (params: {
  surveyId: string
  surveyUuid: string
  preferredLang: string
}): Promise<UserGroupTableRow[]> => {
  const { surveyId, surveyUuid, preferredLang } = params

  const [groups, usersByUuid] = await Promise.all([API.fetchUserGroups({ surveyId }), fetchUsersByUuid(surveyId)])

  const membersByGroup = await Promise.all(
    groups.map((group: UserGroupType) =>
      API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string })
    )
  )

  return groups.flatMap((group: UserGroupType, groupIndex: number) =>
    buildGroupRows({ group, members: membersByGroup[groupIndex], usersByUuid, surveyUuid, preferredLang })
  )
}

/**
 * Loads every user group defined in the current survey together with their members (name, email,
 * survey role and account status), and flattens them into one row per group-member pair, suited
 * for a plain reporting table. Groups without members are represented by a single row with empty
 * member fields, so every group stays visible in the report.
 *
 * @returns {UseUserGroupsTableResult} The flattened rows and a loading flag.
 */
export const useUserGroupsTable = (): UseUserGroupsTableResult => {
  // useSurveyId's untyped implementation makes TS infer its return type as `unknown`; cast to the
  // `string` shape the API service functions declare, following the useUserGroupsSummary.ts precedent.
  const surveyId = useSurveyId() as string
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const preferredLang = useSurveyPreferredLang() as string

  const [rows, setRows] = useState<UserGroupTableRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    fetchUserGroupsTableRows({ surveyId, surveyUuid, preferredLang }).then((data) => {
      if (!ignore) {
        setRows(data)
        setLoading(false)
      }
    })

    return () => {
      ignore = true
    }
  }, [surveyId, surveyUuid, preferredLang])

  return { rows, loading }
}
