import { useNavigate } from 'react-router'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import { Button, ButtonDownload } from '@webapp/components'
import { TextInput } from '@webapp/components/form'
import { useAuthCanCreateUsers, useUserIsSystemAdmin } from '@webapp/store/user'

import { UsersBackupButtons } from './UsersBackup'

type TableHeaderLeftProps = {
  search?: string
  handleSearch: (...args: any[]) => any
  onUsersRestored?: (...args: any[]) => any
  selectedItems?: any[]
}

export const TableHeaderLeft = (props: TableHeaderLeftProps) => {
  const { search, handleSearch, onUsersRestored, selectedItems = [] } = props

  const canCreateUsers = useAuthCanCreateUsers()
  const isSystemAdmin = useUserIsSystemAdmin()
  const navigate = useNavigate()

  return (
    <div className="users__header-left">
      <TextInput
        className="users__header-left__input-search"
        placeholder="usersView:filterPlaceholder"
        defaultValue={search}
        onChange={handleSearch}
      />
      <ButtonDownload label="common.exportToExcel" href="/api/users/export" />
      {isSystemAdmin && <UsersBackupButtons onUsersRestored={onUsersRestored} selectedUsers={selectedItems} />}
      {canCreateUsers && (
        <Button label="appModules.userNew" onClick={() => navigate(appModuleUri(userModules.userNew))} />
      )}
      <div /> {/* spacer */}
    </div>
  )
}
