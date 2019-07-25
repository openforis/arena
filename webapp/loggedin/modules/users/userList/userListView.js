import React from 'react'

import TableView from '../../../tableViews/tableView'
import useI18n from '../../../../commonComponents/useI18n'

const UsersHeaderLeft = () => {
  const i18n = useI18n()

  return (
    <div>
      <button className="btn btn-s">
        <span className="icon icon-user-plus icon-14px icon-left"/>
        {i18n.t('usersView.inviteUser')}
      </button>
    </div>
  )
}

const UsersRowHeader = () => {
  const i18n = useI18n()
  return (
    <>
      <div>{i18n.t('common.name')}</div>
      <div>{i18n.t('common.email')}</div>
      <div>{i18n.t('common.group')}</div>
      <div>{i18n.t('usersView.accepted')}</div>
    </>
  )
}

const UsersRow = props => {
  const { row: user } = props
  const i18n = useI18n()

  return (
    <>
      <div>{user.name}</div>
      <div>{user.email}</div>
      <div>{i18n.t(`authGroups.${user.groupName}.label`)}</div>
      <div>{user.accepted ? i18n.t('common.yes') : i18n.t('common.no')}</div>
    </>
  )
}

const UsersListView = () => (
  <TableView
    module={'users'}
    className="records"
    gridTemplateColumns={'repeat(4, 1fr)'}
    headerLeftComponent={UsersHeaderLeft}
    rowHeaderComponent={UsersRowHeader}
    rowComponent={UsersRow}
  />
)

export default UsersListView
