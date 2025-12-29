import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { MessageStatus, MessageTarget, Messages } from '@openforis/arena-core'

import { ButtonGroup, TextInput } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { MessageActions } from '@webapp/store/ui/message'
import { useMessage } from '@webapp/store/ui/message/hooks'

const targetItems = [
  MessageTarget.All,
  MessageTarget.SystemAdmins,
  MessageTarget.SurveyManagers,
  MessageTarget.DataEditors,
].map((target) => ({
  key: target,
  label: `messageView.target.${target}`,
}))

const MessageDetails = () => {
  const dispatch = useDispatch()
  const { messageUuid } = useParams()
  const message = useMessage()

  const readOnly = !message || Messages.getStatus(message) === MessageStatus.Sent

  useEffect(() => {
    messageUuid && dispatch(MessageActions.fetchMessage({ messageUuid }))
  }, [dispatch, messageUuid])

  const onMessageChange = useCallback(
    (messageUpdated) => {
      dispatch(MessageActions.updateMessage({ message: messageUpdated }))
    },
    [dispatch]
  )

  const onSubjectChange = useCallback(
    (value) => {
      onMessageChange(Messages.assocSubject(value)(message))
    },
    [message, onMessageChange]
  )

  const onBodyChange = useCallback(
    (value) => {
      onMessageChange(Messages.assocBody(value)(message))
    },
    [message, onMessageChange]
  )

  const onTargetChange = useCallback(
    (value) => {
      const targetsPrev = Messages.getTargets(message)
      let targetsNext = value
      if (value.length > 1) {
        if (targetsPrev.includes(MessageTarget.All)) {
          // if "all" was previously selected and now other targets are selected, remove "all"
          targetsNext = value.filter((t) => t !== MessageTarget.All)
        } else if (value.includes(MessageTarget.All)) {
          // if "all" is now selected along with other targets, keep only "all"
          targetsNext = [MessageTarget.All]
        }
      }
      onMessageChange(Messages.assocTargets(targetsNext)(message))
    },
    [message, onMessageChange]
  )

  if (!message) {
    return '...'
  }

  return (
    <div>
      <FormItem label="messageView.subject">
        <TextInput value={Messages.getSubject(message)} onChange={onSubjectChange} />
      </FormItem>
      <FormItem label="messageView.body">
        <TextInput value={Messages.getBody(message)} onChange={onBodyChange} />
      </FormItem>
      <FormItem label="messageView.audience">
        <ButtonGroup
          disabled={readOnly}
          groupName="messageTargets"
          multiple
          onChange={onTargetChange}
          selectedItemKey={Messages.getTargets(message)}
          items={targetItems}
        />
      </FormItem>
    </div>
  )
}

export default MessageDetails
