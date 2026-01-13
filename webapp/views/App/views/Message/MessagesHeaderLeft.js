import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'

import { MessageActions } from '@webapp/store/ui/message'
import { ButtonNew } from '@webapp/components'

const MessagesHeaderLeft = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const createMessage = useCallback(() => {
    dispatch(MessageActions.createMessage({ navigate }))
  }, [dispatch, navigate])

  return <ButtonNew onClick={createMessage} />
}

export default MessagesHeaderLeft
