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

    const fetchData = async (): Promise<UserGroupTableRow[]> => {
      const [groups, { data: usersRes }] = await Promise.all([
        API.fetchUserGroups({ surveyId }),
        axios.get<SurveyUsersResponse>(`/api/survey/${surveyId}/users`),
      ])
      const usersByUuid: Record<string, Record<string, unknown>> = {}
      usersRes.list.forEach((user) => {
        usersByUuid[User.getUuid(user) as string] = user
      })

      const membersByGroup = await Promise.all(
        groups.map((group: UserGroupType) =>
          API.fetchUserGroupMembers({ surveyId, groupUuid: UserGroup.getUuid(group) as string })
        )
      )

      const result: UserGroupTableRow[] = []
      groups.forEach((group: UserGroupType, groupIndex: number) => {
        const groupUuid = UserGroup.getUuid(group) as string
        const groupName = UserGroup.getName(group)
        const groupLabel = UserGroup.getLabel(preferredLang)(group)
        const qualifiers = UserGroup.getQualifiers(group)
          .map((qualifier) => `${UserGroupQualifier.getName(qualifier)}=${UserGroupQualifier.getValue(qualifier)}`)
          .join(', ')

        const members = membersByGroup[groupIndex]

        if (members.length === 0) {
          result.push({
            id: `${groupUuid}-${EMPTY_MEMBER_KEY}`,
            groupUuid,
            groupName,
            groupLabel,
            qualifiers,
            memberUuid: null,
            memberName: '',
            memberEmail: '',
            memberRole: '',
            memberStatus: '',
          })
          return
        }

        members.forEach((member) => {
          const memberUuid = member.uuid as string
          // The members endpoint only returns {uuid, name, email}; look up the full survey user
          // record (fetched separately) to read role and status, avoiding a per-member API call.
          const fullUser = usersByUuid[memberUuid]
          const authGroup = fullUser
            ? User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(fullUser)
            : null
          const memberRole = authGroup ? AuthGroup.getName(authGroup) : ''
          const memberStatus = fullUser ? ((User.getStatus(fullUser) as string) ?? '') : ''

          result.push({
            id: `${groupUuid}-${memberUuid}`,
            groupUuid,
            groupName,
            groupLabel,
            qualifiers,
            memberUuid,
            memberName: (member.name as string) ?? '',
            memberEmail: (member.email as string) ?? '',
            memberRole,
            memberStatus,
          })
        })
      })
      return result
    }

    fetchData().then((data) => {
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
