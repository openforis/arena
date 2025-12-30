import './MessageDetails.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router'

import { MessageStatus, MessageTarget, Messages } from '@openforis/arena-core'

import { ButtonGroup, TextInput } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { MessageActions } from '@webapp/store/ui/message'
import { useMessage } from '@webapp/store/ui/message/hooks'
import { Button, Markdown, Switch } from '@webapp/components'
import { useConfirm } from '@webapp/components/hooks'

const targetItems = [
  MessageTarget.All,
  MessageTarget.SystemAdmins,
  MessageTarget.SurveyManagers,
  MessageTarget.DataEditors,
].map((target) => ({
  key: target,
  label: `messageView:target.${target}`,
}))

const MessageDetails = () => {
  const dispatch = useDispatch()
  const { messageUuid } = useParams()
  const message = useMessage()
  const confirm = useConfirm()
  const [showPreview, setShowPreview] = useState(true)

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

  const onShowPreviewChange = useCallback((checked) => {
    setShowPreview(checked)
  }, [])

  const onSendClick = useCallback(() => {
    confirm({
      key: 'messageView:sendMessage.confirmTitle',
      onOk: () => dispatch(MessageActions.sendMessage()),
    })
  }, [confirm, dispatch])

  if (!message) {
    return '...'
  }

  const messageBody = Messages.getBody(message) ?? ''

  return (
    <div className="message-details">
      <FormItem label="messageView:subject">
        <TextInput onChange={onSubjectChange} readOnly={readOnly} value={Messages.getSubject(message)} />
      </FormItem>
      <FormItem label="messageView:body">
        <div className="message-body-editor">
          <TextInput onChange={onBodyChange} readOnly={readOnly} rows={12} value={messageBody} />
          <Switch label="messageView:preview" checked={showPreview} onChange={onShowPreviewChange} />
          {showPreview && <Markdown source={messageBody} className="message-body-preview" />}
        </div>
      </FormItem>
      <FormItem label="messageView:target.label">
        <ButtonGroup
          disabled={readOnly}
          groupName="messageTargets"
          items={targetItems}
          multiple
          onChange={onTargetChange}
          selectedItemKey={Messages.getTargets(message)}
        />
      </FormItem>
      {!readOnly && <Button className="message-send-btn" label="messageView:sendMessage.label" onClick={onSendClick} />}
    </div>
  )
}

export default MessageDetails
