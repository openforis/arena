import React from 'react'

import type { UserGroup as UserGroupType } from '@openforis/arena-core'

import * as User from '@core/user/user'
import * as UserGroup from '@core/user/userGroup/userGroup'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import type { SurveyUserType } from './useUserGroupsSummary'
import UserCard from './UserCard'

type Props = {
  group: UserGroupType | null
  groupKey: string
  members: SurveyUserType[]
  draggable: boolean
  pendingUserUuids: Set<string>
  containerRef: (el: HTMLUListElement | null) => void
}

/**
 * One column of the UserGroupsSummary Kanban board: either a user group or the "Unassigned"
 * bucket (when group is null), listing the survey users currently assigned to it as cards.
 *
 * @param props0 - The component props.
 * @param props0.group - The user group this column represents, or null for the Unassigned column.
 * @param props0.groupKey - The group's uuid, or the UNASSIGNED_GROUP_KEY sentinel; set as the column's data-group-uuid attribute.
 * @param props0.members - The survey users currently assigned to this column.
 * @param props0.draggable - Whether the cards in this column can be dragged.
 * @param props0.pendingUserUuids - Uuids of users with a group change currently in flight; their cards render as non-draggable until it settles.
 * @param props0.containerRef - Callback ref registering this column's drop-target list element with the drag-and-drop hook.
 * @returns {React.ReactElement} - The UserGroupColumn component.
 */
const UserGroupColumn = (props: Props): React.ReactElement => {
  const { group, groupKey, members, draggable, pendingUserUuids, containerRef } = props
  const i18n = useI18n()
  const preferredLang = useSurveyPreferredLang() as string

  const title = group
    ? UserGroup.getLabel(preferredLang, UserGroup.getName(group))(group)
    : i18n.t('usersView:userGroup.unassigned')

  return (
    <div className="user-group-column">
      <div className="user-group-column__header">
        <span className="user-group-column__title">{title}</span>
        <span className="user-group-column__count">{members.length}</span>
      </div>
      <ul className="user-group-column__list" ref={containerRef} data-group-uuid={groupKey}>
        {members.length === 0 && (
          <li className="user-group-column__empty">{i18n.t('usersView:userGroup.noMembers')}</li>
        )}
        {members.map((user) => {
          const userUuid = User.getUuid(user) as string
          const pending = pendingUserUuids.has(userUuid)
          return <UserCard key={userUuid} user={user} draggable={draggable && !pending} pending={pending} />
        })}
      </ul>
    </div>
  )
}

export default UserGroupColumn
