import { Fragment, useMemo, useState } from 'react'
import classNames from 'classnames'
import Collapse from '@mui/material/Collapse'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { Button } from '@webapp/components'
import { ButtonGroup, TextInput } from '@webapp/components/form'
import { useI18n } from '@webapp/store/system'

export const UserAction = {
  insert: 'insert',
  skip: 'skip',
  updateRoles: 'updateRoles',
  updateAll: 'updateAll',
}
export const newUserActions = [UserAction.insert, UserAction.skip]
export const existingUserActions = [UserAction.skip, UserAction.updateRoles, UserAction.updateAll]

type PreviewRoles = {
  mainRoles: string[]
  surveyRoles: { surveyName: string; role: string; surveyExists?: boolean }[]
  userGroups: { surveyName: string; name: string; groupExists?: boolean }[]
}

export type ImportPreviewUser = {
  email: string
  name?: string | null
  existing: boolean
  backup: PreviewRoles
  current: PreviewRoles | null
}

export const UserActionButtonGroup = ({
  actions,
  onChange,
  selectedAction,
  short = false,
}: {
  actions: string[]
  onChange: (action: string) => void
  selectedAction: string | null
  short?: boolean
}) => (
  <ButtonGroup
    items={actions.map((action) => ({
      key: action,
      label: `usersView:usersBackup.${short ? 'userActionShort' : 'userAction'}.${action}`,
      title: `usersView:usersBackup.userAction.${action}`,
    }))}
    // ButtonGroup (JS) passes the selected item key to onChange, but its inferred type has no params
    onChange={onChange as () => void}
    selectedItemKey={selectedAction}
  />
)

const useRoleLabel = () => {
  const i18n = useI18n()
  return (role: string | undefined) => (role ? i18n.t(`auth:authGroups.${role}.label`) : '-')
}

// survey roles in the backup compared with the ones already defined in this server
const UserRolesDetails = ({ user }: { user: ImportPreviewUser }) => {
  const i18n = useI18n()
  const roleLabel = useRoleLabel()
  const { backup, current, existing } = user

  const surveyNames = [
    ...new Set([...backup.surveyRoles, ...(current?.surveyRoles ?? [])].map((item) => item.surveyName)),
  ].sort((a, b) => a.localeCompare(b))

  const userGroupKeys = [
    ...new Set([...backup.userGroups, ...(current?.userGroups ?? [])].map((g) => `${g.surveyName} / ${g.name}`)),
  ].sort((a, b) => a.localeCompare(b))
  const hasUserGroup = (groups: PreviewRoles['userGroups'] = [], key: string) =>
    groups.find((g) => `${g.surveyName} / ${g.name}` === key)

  const notFoundLabel = (
    <span className="users-backup-roles-details__not-found">
      {i18n.t('usersView:usersBackup.details.notFoundInThisServer')}
    </span>
  )

  return (
    <div className="users-backup-roles-details">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{i18n.t('usersView:usersBackup.details.survey')}</TableCell>
            <TableCell>{i18n.t('usersView:usersBackup.details.roleInBackup')}</TableCell>
            {existing && <TableCell>{i18n.t('usersView:usersBackup.details.currentRole')}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <strong>{i18n.t('usersView:usersBackup.details.mainRole')}</strong>
            </TableCell>
            <TableCell>{backup.mainRoles.map(roleLabel).join(', ') || '-'}</TableCell>
            {existing && <TableCell>{current.mainRoles.map(roleLabel).join(', ') || '-'}</TableCell>}
          </TableRow>
          {surveyNames.map((surveyName) => {
            const backupRole = backup.surveyRoles.find((item) => item.surveyName === surveyName)
            const currentRole = current?.surveyRoles.find((item) => item.surveyName === surveyName)
            return (
              <TableRow key={surveyName}>
                <TableCell>{surveyName}</TableCell>
                <TableCell>
                  {roleLabel(backupRole?.role)} {backupRole?.surveyExists === false && notFoundLabel}
                </TableCell>
                {existing && <TableCell>{roleLabel(currentRole?.role)}</TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {userGroupKeys.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{i18n.t('usersView:usersBackup.details.userGroup')}</TableCell>
              <TableCell>{i18n.t('usersView:usersBackup.details.inBackup')}</TableCell>
              {existing && <TableCell>{i18n.t('usersView:usersBackup.details.currentMember')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {userGroupKeys.map((key) => {
              const backupGroup = hasUserGroup(backup.userGroups, key)
              return (
                <TableRow key={key}>
                  <TableCell>{key}</TableCell>
                  <TableCell>
                    {i18n.t(backupGroup ? 'common.yes' : 'common.no')}{' '}
                    {backupGroup?.groupExists === false && notFoundLabel}
                  </TableCell>
                  {existing && (
                    <TableCell>{i18n.t(hasUserGroup(current?.userGroups, key) ? 'common.yes' : 'common.no')}</TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

const UserRow = ({
  user,
  action,
  onActionChange,
}: {
  user: ImportPreviewUser
  action: string
  onActionChange: (action: string) => void
}) => {
  const i18n = useI18n()
  const roleLabel = useRoleLabel()
  const [expanded, setExpanded] = useState(false)
  const { email, name, existing, backup, current } = user
  const mainRoles = (existing ? current.mainRoles : backup.mainRoles).map(roleLabel).join(', ')

  return (
    <>
      <TableRow className={classNames({ expanded })} hover>
        <TableCell padding="checkbox">
          <Button
            iconClassName={expanded ? 'icon-circle-up' : 'icon-circle-down'}
            onClick={() => setExpanded(!expanded)}
            title="common.expandCollapse"
            variant="text"
          />
        </TableCell>
        <TableCell className="users-backup-import-users-table__email-cell" title={email}>
          {email}
        </TableCell>
        <TableCell>{name}</TableCell>
        <TableCell>{mainRoles}</TableCell>
        <TableCell>
          <span
            className={classNames('users-backup-user-status', {
              'users-backup-user-status--new': !existing,
            })}
          >
            {i18n.t(existing ? 'usersView:usersBackup.userExisting' : 'usersView:usersBackup.userNew')}
          </span>
        </TableCell>
        <TableCell className="users-backup-import-users-table__action-cell">
          <UserActionButtonGroup
            actions={existing ? existingUserActions : newUserActions}
            onChange={onActionChange}
            selectedAction={action}
            short
          />
        </TableCell>
      </TableRow>
      <TableRow className="users-backup-import-users-table__details-row">
        <TableCell colSpan={6}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <UserRolesDetails user={user} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export const UsersBackupImportUsersTable = ({
  users,
  actionsByEmail,
  onActionChange,
}: {
  users: ImportPreviewUser[]
  actionsByEmail: Record<string, string>
  onActionChange: (user: ImportPreviewUser) => (action: string) => void
}) => {
  const i18n = useI18n()
  const [search, setSearch] = useState('')

  const usersFiltered = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    if (!searchLower) return users
    return users.filter(
      ({ email, name }) => email.toLowerCase().includes(searchLower) || name?.toLowerCase().includes(searchLower)
    )
  }, [search, users])

  return (
    <div className="users-backup-import-users-table">
      <TextInput
        className="users-backup-import-users-table__search"
        placeholder="usersView:filterPlaceholder"
        value={search}
        onChange={setSearch}
      />
      <TableContainer className="users-backup-import-users-table__container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>{i18n.t('common.email')}</TableCell>
              <TableCell>{i18n.t('common.name')}</TableCell>
              <TableCell>{i18n.t('usersView:usersBackup.details.mainRole')}</TableCell>
              <TableCell>{i18n.t('usersView:usersBackup.userStatus')}</TableCell>
              <TableCell>{i18n.t('usersView:usersBackup.userActionHeader')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersFiltered.map((user) => (
              <Fragment key={user.email}>
                <UserRow user={user} action={actionsByEmail[user.email]} onActionChange={onActionChange(user)} />
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}
