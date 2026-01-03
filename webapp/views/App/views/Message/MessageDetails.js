import './MessageDetails.scss'

import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router'

import { MessageStatus, MessageTargetUserType, Messages } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { Button, ButtonDelete, ButtonSave, Markdown, Switch } from '@webapp/components'
import { ButtonGroup } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import InputChipsText from '@webapp/components/form/InputChips/InputChipsText'
import { useConfirm } from '@webapp/components/hooks'
import { MessageActions } from '@webapp/store/ui/message'
import { useMessage } from '@webapp/store/ui/message/hooks'

const targetUserTypeItems = [
  MessageTargetUserType.All,
  MessageTargetUserType.SystemAdmins,
  MessageTargetUserType.SurveyManagers,
  MessageTargetUserType.DataEditors,
  MessageTargetUserType.Individual,
].map((targetUserType) => ({
  key: targetUserType,
  label: `messageView:target.userType.${targetUserType}`,
}))

const emailTransformFunction = (value) => value.trim().toLowerCase()

const MessageDetails = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
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

  const onTargetUserTypesChange = useCallback(
    (value) => {
      const targetsPrev = Messages.getTargetUserTypes(message)
      let targetsNext = value
      if (value.length === 0) {
        // prevent having no target selected
        targetsNext = [MessageTargetUserType.All]
      } else if (value.length > 1) {
        if (targetsPrev.includes(MessageTargetUserType.All)) {
          // if "all" was previously selected and now other targets are selected, remove "all"
          targetsNext = value.filter((t) => t !== MessageTargetUserType.All)
        } else if (targetsPrev.includes(MessageTargetUserType.Individual)) {
          // if "individual" was previously selected and now other targets are selected, remove "individual"
          targetsNext = value.filter((t) => t !== MessageTargetUserType.Individual)
        } else if (value.includes(MessageTargetUserType.All)) {
          // if "all" is now selected along with other targets, keep only "all"
          targetsNext = [MessageTargetUserType.All]
        } else if (value.includes(MessageTargetUserType.Individual)) {
          // if "individual" is now selected along with other targets, keep only "individual"
          targetsNext = [MessageTargetUserType.Individual]
        }
      }
      let messageNext = Messages.assocTargetUserTypes(targetsNext)(message)
      // clear not applicable props
      const targetEmailsNext = targetsNext.includes(MessageTargetUserType.Individual)
        ? Messages.getTargetUserEmails(message)
        : []
      messageNext = Messages.assocTargetUserEmails(targetEmailsNext)(messageNext)
      const excludedEmailsNext = targetsNext.includes(MessageTargetUserType.Individual)
        ? []
        : Messages.getTargetExcludedUserEmails(message)
      messageNext = Messages.assocTargetExcludedUserEmails(excludedEmailsNext)(messageNext)
      onMessageChange(messageNext)
    },
    [message, onMessageChange]
  )

  const onTargetEmailsIncludedChange = useCallback(
    (value) => {
      onMessageChange(Messages.assocTargetUserEmails(value)(message))
    },
    [message, onMessageChange]
  )

  const onTargetEmailsExcludedChange = useCallback(
    (value) => {
      onMessageChange(Messages.assocTargetExcludedUserEmails(value)(message))
    },
    [message, onMessageChange]
  )

  const onShowPreviewChange = useCallback((checked) => {
    setShowPreview(checked)
  }, [])

  const onBackClick = useCallback(() => {
    dispatch(MessageActions.resetMessage({ navigate }))
  }, [dispatch, navigate])

  const onSendClick = useCallback(() => {
    confirm({
      key: 'messageView:sendMessage.confirmTitle',
      onOk: () => dispatch(MessageActions.sendMessage()),
    })
  }, [confirm, dispatch])

  const onDeleteClick = useCallback(() => {
    confirm({
      key: 'messageView:deleteMessage.confirmTitle',
      onOk: () => {
        dispatch(MessageActions.deleteMessage({ navigate }))
      },
    })
  }, [confirm, dispatch, navigate])

  if (!message) {
    return '...'
  }

  const messageBody = Messages.getBody(message) ?? ''
  const validation = Validation.getValidation(message)
  const targetingIndividualUsers = Messages.getTargetUserTypes(message).includes(MessageTargetUserType.Individual)

  return (
    <div className="message-details">
      <FormItem label="messageView:subject">
        <Input
          onChange={onSubjectChange}
          readOnly={readOnly}
          value={Messages.getSubject(message)}
          validation={Validation.getFieldValidation('subject')(validation)}
        />
      </FormItem>
      <FormItem label="messageView:body.label" info="messageView:body.info" isInfoMarkdown>
        <div className="message-body-editor">
          <Input
            onChange={onBodyChange}
            readOnly={readOnly}
            inputType="textarea"
            textAreaRows={12}
            value={messageBody}
            validation={Validation.getFieldValidation('body')(validation)}
          />
          <Switch label="messageView:preview" checked={showPreview} onChange={onShowPreviewChange} />
          {showPreview && <Markdown source={messageBody} className="message-body-preview" />}
        </div>
      </FormItem>
      <FormItem label="messageView:target.userTypes.label">
        <ButtonGroup
          disabled={readOnly}
          groupName="messageTargetUserTypes"
          items={targetUserTypeItems}
          multiple
          onChange={onTargetUserTypesChange}
          selectedItemKey={Messages.getTargetUserTypes(message)}
        />
      </FormItem>
      {targetingIndividualUsers && (
        <FormItem label="messageView:target.emailsIncluded.label">
          <InputChipsText
            isInputFieldValueValid={Validator.isEmailValueValid}
            onChange={onTargetEmailsIncludedChange}
            placeholder="messageView:target.emailsIncluded.placeholder"
            selection={Messages.getTargetUserEmails(message)}
            textTransformFunction={emailTransformFunction}
          />
        </FormItem>
      )}
      {!targetingIndividualUsers && (
        <FormItem label="messageView:target.emailsExcluded.label">
          <InputChipsText
            isInputFieldValueValid={Validator.isEmailValueValid}
            onChange={onTargetEmailsExcludedChange}
            placeholder="messageView:target.emailsExcluded.placeholder"
            selection={Messages.getTargetExcludedUserEmails(message)}
            textTransformFunction={emailTransformFunction}
          />
        </FormItem>
      )}

      <div className="button-bar">
        <Button label="common.back" onClick={onBackClick} variant="outlined" />
        {!readOnly && (
          <>
            <ButtonSave
              className="message-send-btn"
              disabled={Validation.isNotValid(validation)}
              label="messageView:sendMessage.label"
              onClick={onSendClick}
            />
            <ButtonDelete onClick={onDeleteClick} />
          </>
        )}
      </div>
    </div>
  )
}

export default MessageDetails
