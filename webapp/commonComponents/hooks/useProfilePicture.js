import { useEffect, useState } from 'react'

import { useAsyncGetRequest } from '.'

export default (userUuid, forceUpdateKey) => {
  const [profilePicture, setProfilePicture] = useState(null)

  const { data = null, dispatch } = useAsyncGetRequest(
    `/api/user/${userUuid}/profilePicture`,
    {
      responseType: 'blob',
    },
  )

  useEffect(dispatch, [userUuid, forceUpdateKey])

  useEffect(() => {
    if (data) {
      setProfilePicture(URL.createObjectURL(data))
    }
  }, [data])

  return profilePicture
}
