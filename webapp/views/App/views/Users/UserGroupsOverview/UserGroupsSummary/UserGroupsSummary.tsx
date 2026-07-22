import './UserGroupsSummary.scss'

import React, { useMemo } from 'react'

import { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'

import { useAuthCanManageUserGroups } from '@webapp/store/user'

import { UNASSIGNED_GROUP_KEY } from './kanbanConstants'
import type { SurveyUserType } from './useUserGroupsSummary'
import { useUserGroupsSummary } from './useUserGroupsSummary'
import { useUserGroupsKanbanDnd } from './useUserGroupsKanbanDnd'
import UserGroupColumn from './UserGroupColumn'

interface ColumnData {
  key: string
  group: UserGroupType | null
  members: SurveyUserType[]
}

/**
 * Kanban board overview of every survey user's group assignment: one column per user group plus
 * a leading "Unassigned" column, each user shown as a draggable card. Dragging a card into a
 * different column assigns, reassigns or unassigns that user.
 *
 * @returns {React.ReactElement} - The UserGroupsSummary component.
 */
const UserGroupsSummary = (): React.ReactElement => {
  const canManage = useAuthCanManageUserGroups()
  const { groups, users, groupUuidByUserUuid, onChangeUserGroup, reload } = useUserGroupsSummary()

  const columns: ColumnData[] = useMemo(() => {
    const unassignedMembers = users.filter((user) => !groupUuidByUserUuid[User.getUuid(user) as string])
    const groupColumns = groups.map((group) => {
      const groupUuid = UserGroup.getUuid(group) as string
      return {
        key: groupUuid,
        group,
        members: users.filter((user) => groupUuidByUserUuid[User.getUuid(user) as string] === groupUuid),
      }
    })
    return [{ key: UNASSIGNED_GROUP_KEY, group: null, members: unassignedMembers }, ...groupColumns]
  }, [groups, users, groupUuidByUserUuid])

  const { registerColumnRef } = useUserGroupsKanbanDnd({
    enabled: canManage,
    columnKeys: columns.map((column) => column.key),
    onChangeUserGroup,
    reload,
    unassignedGroupKey: UNASSIGNED_GROUP_KEY,
  })

  return (
    <div className="user-groups-summary">
      {columns.map((column) => (
        <UserGroupColumn
          key={column.key}
          groupKey={column.key}
          group={column.group}
          members={column.members}
          draggable={canManage}
          containerRef={registerColumnRef(column.key)}
        />
      ))}
    </div>
  )
}

export default UserGroupsSummary
