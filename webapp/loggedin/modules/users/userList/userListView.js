import React from 'react'

import TableView from '../../../tableViews/tableView'
import useI18n from '../../../../commonComponents/useI18n'

import User from '../../../../../common/user/user'

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
      <div>
        {User.getName(user)}
      </div>
      <div>
        {User.getEmail(user)}
      </div>
      <div>
        {i18n.t(`authGroups.${User.getGroupName(user)}.label`)}
      </div>
      <div>
        {
          User.hasAccepted(user) &&
          <span className="icon icon-user-check icon-16px"/>
        }
      </div>
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
