import React from 'react'

import * as User from '@core/user/user'

import ProfilePicture from '@webapp/components/profilePicture'

import type { SurveyUserType } from './useUserGroupsSummary'

type Props = {
  user: SurveyUserType
  draggable: boolean
}

/**
 * A single card representing a survey user inside a UserGroupColumn of the UserGroupsSummary
 * Kanban board. Draggable cards (draggable=true) can be dragged between columns to assign,
 * reassign or unassign the user's group.
 *
 * @param props0 - The component props.
 * @param props0.user - The survey user to render.
 * @param props0.draggable - Whether the card can be dragged; false renders a static, non-interactive card.
 * @returns {React.ReactElement} - The UserCard component.
 */
const UserCard = (props: Props): React.ReactElement => {
  const { user, draggable } = props
  const userUuid = User.getUuid(user) as string

  return (
    <li className={`user-card${draggable ? ' user-card--draggable' : ''}`} data-user-uuid={userUuid}>
      <ProfilePicture userUuid={userUuid} thumbnail />
      <div className="user-card__details">
        <div className="user-card__name">{User.getName(user)}</div>
        <div className="user-card__email">{User.getEmail(user)}</div>
      </div>
    </li>
  )
}

export default UserCard
