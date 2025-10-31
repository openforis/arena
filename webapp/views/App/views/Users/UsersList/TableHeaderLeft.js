import React from 'react'
import { useNavigate } from 'react-router'
import PropTypes from 'prop-types'

import { Button, ButtonDownload } from '@webapp/components'
import { TextInput } from '@webapp/components/form'
import { useAuthCanCreateUsers } from '@webapp/store/user'
import { appModuleUri, userModules } from '@webapp/app/appModules'

export const TableHeaderLeft = (props) => {
  const { search, handleSearch } = props

  const canCreateUsers = useAuthCanCreateUsers()
  const navigate = useNavigate()

  return (
    <div className="users__header-left">
      <TextInput
        className="users__header-left__input-search"
        placeholder="usersView:filterPlaceholder"
        defaultValue={search}
        onChange={handleSearch}
      />
      <ButtonDownload label="common.exportAll" href="/api/users/export" />
      {canCreateUsers && (
        <Button label="appModules.userNew" onClick={() => navigate(appModuleUri(userModules.userNew))} />
      )}
      <div /> {/* spacer */}
    </div>
  )
}

TableHeaderLeft.propTypes = {
  search: PropTypes.string,
  handleSearch: PropTypes.func.isRequired,
}
