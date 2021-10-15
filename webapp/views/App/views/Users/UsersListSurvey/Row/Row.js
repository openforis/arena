import React from 'react'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import { useOnInviteRepeat } from '@webapp/views/App/views/Users/UserEdit/store/actions/useOnInviteRepeat'
import { ButtonInvite } from '@webapp/components'

import ProfilePicture from '@webapp/components/profilePicture'
import * as DateUtils from '@core/dateUtils'

const Row = (props) => {
  const { row: userListItem, emailVisible } = props
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)

  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)

  const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(userListItem)
  const authGroupName = AuthGroup.getName(authGroup)
  const email = User.getEmail(userListItem)
  const invitedBy = User.getInvitedBy(userListItem)
  const invitedDate = User.getInvitedDate(userListItem)

  const handleResendInvitation = useOnInviteRepeat({ userToInvite: userListItem, hasToNavigate: false })

  return (
    <>
      <div data-testid={TestId.userList.profilePicture} className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={User.getUuid(userListItem)} thumbnail />
      </div>
      <div data-testid={TestId.userList.name}>{User.getName(userListItem)}</div>
      {emailVisible && (
        <div data-testid={TestId.userList.email} data-value={email}>
          {email}
        </div>
      )}
      <div data-testid={TestId.userList.authGroup} data-value={authGroupName}>
        {i18n.t(`authGroups.${authGroupName}.label_plural`)}
      </div>
      <div data-testid={TestId.userList.invitedBy} data-value={invitedBy}>
        {invitedBy}
      </div>
      <div
        data-testid={TestId.userList.invitedDate}
        data-value={invitedDate}
        title={invitedDate ? DateUtils.format(DateUtils.parseISO(invitedDate), DateUtils.formats.datetimeDefault) : ''}
      >
        {invitedDate ? DateUtils.format(DateUtils.parseISO(invitedDate), DateUtils.formats.dateDefault) : ''}
      </div>
      <div>
        {User.hasAccepted(userListItem) && <span className="icon icon-user-check icon-16px" />}
        {User.isInvited(userListItem) && User.isInvitationExpired(userListItem) && (
          <span className="icon icon-crying icon-16px icon-invitation-expired" />
        )}
        {User.isInvited(userListItem) && (
          <ButtonInvite className="icon-invitation-retry" onClick={handleResendInvitation} showLabel={false} />
        )}
      </div>
      <div data-testid={TestId.userList.edit}>
        <span className={`icon icon-12px icon-action ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
  emailVisible: PropTypes.bool,
}

Row.defaultProps = {
  emailVisible: false,
}

export default Row
