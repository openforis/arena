import React from 'react'

import * as User from '@core/user/user'

import { Button } from '@webapp/components'
import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

import { useUserGroupMembersEditor } from './useUserGroupMembersEditor'

type Props = {
  groupUuid: string
  canEdit?: boolean
}

const getUserLabel = (user: Record<string, unknown>): string => `${User.getName(user)} (${User.getEmail(user)})`

/**
 * Member-management panel for an existing user group: lists current members, allows adding a
 * member from the survey's user list (with a reassignment confirmation if they're already in a
 * different group) and removing a member. Self-contained: fetches its own data via
 * `useUserGroupMembersEditor`.
 *
 * @param props0 - The component props.
 * @param props0.groupUuid - Uuid of the group whose members are being managed.
 * @param props0.canEdit - Whether add/remove controls are shown.
 * @returns {React.ReactElement} - The UserGroupMembersEditor component.
 */
export const UserGroupMembersEditor = (props: Props): React.ReactElement => {
  const { groupUuid, canEdit = false } = props
  const i18n = useI18n()
  const { members, availableUsers, onAddMember, onRemoveMember } = useUserGroupMembersEditor({ groupUuid })

  return (
    <div className="user-group-members-editor">
      <h4>{i18n.t('usersView:userGroup.members')}</h4>
      {members.length === 0 && <div>{i18n.t('usersView:userGroup.noMembers')}</div>}
      {members.map((member) => {
        const userUuid = User.getUuid(member) as string
        return (
          <div key={userUuid} className="user-group-members-editor__row">
            <span>{getUserLabel(member)}</span>
            {canEdit && (
              <Button iconClassName="icon-cross icon-12px" variant="text" onClick={() => onRemoveMember(userUuid)} />
            )}
          </div>
        )
      })}
      {canEdit && (
        <Dropdown
          clearable={false}
          items={availableUsers}
          itemValue={(user: Record<string, unknown>) => User.getUuid(user)}
          itemLabel={getUserLabel}
          placeholder={i18n.t('usersView:userGroup.addMember')}
          selection={null}
          onChange={(user: Record<string, unknown>) => onAddMember(User.getUuid(user) as string)}
        />
      )}
    </div>
  )
}
