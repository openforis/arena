import React from 'react'
import { connect } from 'react-redux'

import User from '../../common/user/user'

import { useProfilePicture } from './hooks'

import * as AppState from '../app/appState'

const ProfilePicture = ({ user }) => {
  const picture = useProfilePicture(null, user)
  return <img src={picture}/>
}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
})

export default connect(mapStateToProps)(ProfilePicture)
