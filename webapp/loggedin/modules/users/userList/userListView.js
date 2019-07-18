import React, { useEffect, useState } from 'react'

import * as R from 'ramda'

import { fetchUsers } from './actions'

import { connect } from 'react-redux'

import UserListTable from './userListTable'
import * as AppState from '../../../../app/appState'

const SurveyListView = props => {
  const { fetchUsers, users } = props

  useEffect(() => { fetchUsers() }, [])

  return users && users.length ? (
    <UserListTable
      offset={0}
      limit={25}
      count={10}
      fetchUsers={fetchUsers}
      users={users}>
    </UserListTable>) : null
}

const mapStateToProps = state => console.log(state.users.userList.users) || ({
  users: state.users.userList.users,
})

export default connect(
  mapStateToProps,
  { fetchUsers }
)(SurveyListView)
