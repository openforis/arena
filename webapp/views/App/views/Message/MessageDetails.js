import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { Messages, MessageStatus, MessageTarget } from '@openforis/arena-server'

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
  const message = useMessage()

  const readOnly = Messages.getStatus(message) === MessageStatus.Sent

  const onMessageChange = useCallback(
    (messageUpated) => {
      dispatch(MessageActions.updateMessage(messageUpated))
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
      onMessageChange(Messages.assocTargets(value)(message))
    },
    [message, onMessageChange]
  )

  return (
    <div>
      <FormItem label="messageView.subject">
        <TextInput value={message.subject} onChange={onSubjectChange} />
      </FormItem>
      <FormItem label="messageView.body">
        <TextInput value={message.body} onChange={onBodyChange} />
      </FormItem>
      <FormItem label="messageView.audience">
        <ButtonGroup
          disabled={readOnly}
          groupName="messageTargets"
          multiple
          onChange={onTargetChange}
          selectedItemKey={Messages.getAudience(message)}
          items={targetItems}
        />
      </FormItem>
    </div>
  )
}

export default MessageDetails
