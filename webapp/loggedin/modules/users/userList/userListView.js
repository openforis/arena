import './userListView.scss'

import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'

import TablePaginator from '../../../../commonComponents/table/tablePaginator'
import useI18n from '../../../../commonComponents/useI18n'

import { fetchUsers } from './actions'

const SurveyListView = props => {
  const { users, fetchUsers } = props

  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(0)
  const [count, setCount] = useState(0)
  const i18n = useI18n()

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="user-list table">
      <div className="table__header">

        <div>
          <button className="btn btn-s">
            <span className="icon icon-user-plus icon-14px icon-left"/>
            {i18n.t('usersView.inviteUser')}
          </button>
        </div>

        <TablePaginator
          offset={offset}
          limit={limit}
          count={count}
          fetchFn={fetchUsers}/>
      </div>

      <div className="table__row-header">
        <div>{i18n.t('common.name')}</div>
        <div>{i18n.t('common.email')}</div>
        <div>{i18n.t('common.group')}</div>
      </div>


      <div className="table__rows">
        {
          users
            .map(user => (
              <div className={`table__row`}>
                <div>{user.name}</div>
                <div>{user.email}</div>
                <div>{user.groupName}</div>
              </div>
            ))
        }
      </div>
    </div>
  )
}

const mapStateToProps = state => ({
  users: state.users.userList.users || [],
})

export default connect(
  mapStateToProps,
  { fetchUsers }
)(SurveyListView)
