import React, { useEffect, useState } from 'react'

import User from '../../../common/user/user'

import { useAsyncGetRequest } from '.'

export default (userUuid, user) => {
  const [profilePicture, setProfilePicture] = useState(null)

  const uuid = userUuid || User.getUuid(user)

  const {
    data = null, dispatch,
  } = useAsyncGetRequest(`/api/user/${uuid}/profilePicture`, {
    responseType: 'blob',
  })

  useEffect(() => {
    if (uuid) {
      dispatch()
    }
  }, [user, uuid])

  useEffect(() => {
    if (data) {
      setProfilePicture(URL.createObjectURL(data))
    }
  }, [data])

  return profilePicture
}