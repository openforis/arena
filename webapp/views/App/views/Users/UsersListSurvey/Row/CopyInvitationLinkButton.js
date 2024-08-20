import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Button } from '@webapp/components'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { copyToClipboard } from '@webapp/utils/domUtils'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

export const CopyInvitationLinkButton = (props) => {
  const { email, userUuid } = props

  const surveyId = useSurveyId()
  const dispatch = useDispatch()

  const doCopyInvitationLinkToKeyboard = useCallback(async () => {
    const url = await API.fetchUserResetPasswordUrl({ userUuid, surveyId })
    if (await copyToClipboard(url)) {
      dispatch(NotificationActions.notifyInfo({ key: 'usersView.invitationLinkCopiedToClipboard' }))
    }
  }, [dispatch, surveyId, userUuid])

  const handleCopyInvitationLink = useCallback(
    (e) => {
      e.stopPropagation()
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'usersView.copyInvitationLinkConfirmMessage',
          headerText: 'usersView.copyInvitationLink',
          okButtonLabel: 'common.copy',
          params: { email },
          onOk: doCopyInvitationLinkToKeyboard,
        })
      )
    },
    [dispatch, doCopyInvitationLinkToKeyboard, email]
  )

  return (
    <Button
      className="icon-invitation-link"
      iconClassName="icon-left icon-link icon-12px"
      label="usersView.copyInvitationLink"
      onClick={handleCopyInvitationLink}
      showLabel={false}
      variant="text"
    />
  )
}

CopyInvitationLinkButton.propTypes = {
  email: PropTypes.string.isRequired,
  userUuid: PropTypes.string.isRequired,
}
