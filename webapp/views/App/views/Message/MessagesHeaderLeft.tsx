import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { MessageActions } from '@webapp/store/ui/message'
import { ButtonNew } from '@webapp/components'
import { useAppDispatch } from '@webapp/store'

const MessagesHeaderLeft = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const createMessage = useCallback(() => {
    dispatch(MessageActions.createMessage({ navigate }))
  }, [dispatch, navigate])

  return <ButtonNew onClick={createMessage} />
}

export default MessagesHeaderLeft
