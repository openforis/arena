import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { copyToClipboard } from '@webapp/utils/domUtils'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

const messageTypes = {
  passwordReset: 'passwordReset',
  invitation: 'invitation',
}

const notificationKeyByMessageType = {
  [messageTypes.passwordReset]: 'usersView.passwordResetLinkCopiedToClipboard',
  [messageTypes.invitation]: 'usersView.invitationLinkCopiedToClipboard',
}

const confirmMessageKeyByMessageType = {
  [messageTypes.passwordReset]: 'usersView.copyPasswordResetLinkConfirmMessage',
  [messageTypes.invitation]: 'usersView.copyInvitationLinkConfirmMessage',
}

const titleKeyByMessageType = {
  [messageTypes.passwordReset]: 'usersView.copyPasswordResetLink',
  [messageTypes.invitation]: 'usersView.copyInvitationLink',
}

export const CopyPasswordResetLinkButton = (props) => {
  const { email, userUuid, messageType = messageTypes.passwordReset } = props

  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  const doCopyLinkToClipboard = useCallback(async () => {
    const url =
      messageType === messageTypes.invitation
        ? await API.fetchSurveyUserResetPasswordUrl({ userUuid, surveyId })
        : await API.fetchUserResetPasswordUrl({ userUuid })
    if (await copyToClipboard(url)) {
      dispatch(NotificationActions.notifyInfo({ key: notificationKeyByMessageType[messageType] }))
    }
  }, [dispatch, messageType, surveyId, userUuid])

  const handleCopyInvitationLink = useCallback(
    (e) => {
      e.stopPropagation()
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: confirmMessageKeyByMessageType[messageType],
          headerText: titleKeyByMessageType[messageType],
          okButtonLabel: 'common.copy',
          params: { email },
          onOk: doCopyLinkToClipboard,
        })
      )
    },
    [dispatch, doCopyLinkToClipboard, email, messageType]
  )

  return (
    <Button
      className="icon-invitation-link"
      iconClassName="icon-left icon-link icon-12px"
      label={titleKeyByMessageType[messageType]}
      onClick={handleCopyInvitationLink}
      showLabel={false}
      variant="text"
    />
  )
}

CopyPasswordResetLinkButton.propTypes = {
  email: PropTypes.string.isRequired,
  userUuid: PropTypes.string.isRequired,
  messageType: PropTypes.oneOf(Object.values(messageTypes)),
}
