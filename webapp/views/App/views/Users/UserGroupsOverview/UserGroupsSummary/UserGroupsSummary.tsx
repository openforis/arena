import React from 'react'

import * as UserGroup from '@core/user/userGroup/userGroup'
import * as User from '@core/user/user'

import { Dropdown } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'
import { useAuthCanManageUserGroups } from '@webapp/store/user'

import { useUserGroupsSummary } from './useUserGroupsSummary'

const UNASSIGNED = '__unassigned__'

type UserGroupType = Record<string, unknown>

/**
 * Summary/overview table of every survey user, with a dropdown to view and change their user
 * group assignment.
 *
 * @returns {React.ReactElement} - The UserGroupsSummary component.
 */
const UserGroupsSummary = (): React.ReactElement => {
  const i18n = useI18n()
  const canManage = useAuthCanManageUserGroups()
  const { groups, users, groupUuidByUserUuid, onChangeUserGroup } = useUserGroupsSummary()

  const dropdownItems: UserGroupType[] = [
    { uuid: UNASSIGNED, name: i18n.t('usersView:userGroup.unassigned') },
    ...groups,
  ]

  return (
    <table className="user-groups-summary">
      <thead>
        <tr>
          <th>{i18n.t('common.name')}</th>
          <th>{i18n.t('common.email')}</th>
          <th>{i18n.t('usersView:userGroups')}</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const userUuid = User.getUuid(user) as string
          const currentGroupUuid = groupUuidByUserUuid[userUuid] ?? UNASSIGNED
          return (
            <tr key={userUuid}>
              <td>{User.getName(user)}</td>
              <td>{User.getEmail(user)}</td>
              <td>
                <Dropdown
                  clearable={false}
                  disabled={!canManage}
                  items={dropdownItems}
                  itemValue="uuid"
                  itemLabel={(group: UserGroupType) => UserGroup.getName(group) || (group.name as string)}
                  searchable={false}
                  selection={dropdownItems.find((group) => group.uuid === currentGroupUuid)}
                  onChange={(group: UserGroupType) =>
                    onChangeUserGroup(userUuid, group.uuid === UNASSIGNED ? null : (group.uuid as string))
                  }
                />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default UserGroupsSummary
