import React, { useState } from 'react'

import useI18n from '../../../../commonComponents/useI18n'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'

const UserRow = ({ user }) => {
  return (
    <div className={`table__row`}>
      <div>{user.id}</div>
      <div>{user.name}</div>
      <div>{user.email}</div>
      <div>{user.groupName}</div>
    </div>
  )
}

const UserListTable = (props) => {
  const { users, fetchUsers } = props
  const i18n = useI18n()

  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(0)
  const [count, setCount] = useState(0)

  return (
    <div className="survey-list table">
      <div className="table__header">
        <TablePaginator offset={offset}
                        limit={limit}
                        count={count}
                        fetchFn={fetchUsers}/>
      </div>

      <div className="table__row-header">
        <div>{i18n.t('common.id')}</div>
        <div>{i18n.t('common.name')}</div>
        <div>{i18n.t('common.email')}</div>
        <div>Group</div>
      </div>


      <div className="table__rows">
        {
          users
            .map(user => (
              <UserRow
                key={user.id}
                user={user}
                i18n={i18n}/>
            ))
        }
      </div>
    </div>
  )
}

export default UserListTable