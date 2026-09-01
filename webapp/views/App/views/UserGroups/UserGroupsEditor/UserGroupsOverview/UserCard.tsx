import React from 'react'

import * as User from '@core/user/user'

import ProfilePicture from '@webapp/components/profilePicture'

import type { SurveyUserType } from './useUserGroupsOverview'

type Props = {
  user: SurveyUserType
  draggable: boolean
  pending?: boolean
}

/**
 * A single card representing a survey user inside a UserGroupColumn of the UserGroupsOverview
 * Kanban board. Draggable cards (draggable=true) can be dragged between columns to assign,
 * reassign or unassign the user's group.
 *
 * @param props0 - The component props.
 * @param props0.user - The survey user to render.
 * @param props0.draggable - Whether the card can be dragged; false renders a static, non-interactive card.
 * @param props0.pending - Whether a group change for this user is currently being saved; renders a dimmed, non-interactive card regardless of `draggable`, so it can't be dragged again until the change settles.
 * @returns {React.ReactElement} - The UserCard component.
 */
const UserCard = (props: Props): React.ReactElement => {
  const { user, draggable, pending = false } = props
  const userUuid = User.getUuid(user) as string

  const className = ['user-card', draggable && 'user-card--draggable', pending && 'user-card--pending']
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className} data-user-uuid={userUuid}>
      <ProfilePicture userUuid={userUuid} thumbnail />
      <div className="user-card__details">
        <div className="user-card__name">{User.getName(user)}</div>
        <div className="user-card__email">{User.getEmail(user)}</div>
      </div>
    </li>
  )
}

export default UserCard
