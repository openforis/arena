import React from 'react'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import { DataTestId } from '@webapp/utils/dataTestId'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'

import ProfilePicture from '@webapp/components/profilePicture'

const Row = (props) => {
  const { row: userListItem } = props
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)

  const authGroup = User.getAuthGroupBySurveyUuid(Survey.getUuid(surveyInfo))(userListItem)
  const authGroupName = AuthGroup.getName(authGroup)
  const email = User.getEmail(userListItem)

  return (
    <>
      <div data-testid={DataTestId.userList.profilePicture} className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={User.getUuid(userListItem)} thumbnail />
      </div>
      <div data-testid={DataTestId.userList.name}>{User.getName(userListItem)}</div>
      <div data-testid={DataTestId.userList.email} data-value={email}>
        {email}
      </div>
      <div data-testid={DataTestId.userList.authGroup} data-value={authGroupName}>
        {i18n.t(`authGroups.${authGroupName}.label_plural`)}
      </div>
      <div>
        {User.hasAccepted(userListItem) && <span className="icon icon-user-check icon-16px" />}
        {User.isInvited(userListItem) && User.isInvitationExpired(userListItem) && (
          <span className="icon icon-crying icon-16px icon-invitation-expired" />
        )}
      </div>
      <div data-testid={DataTestId.userList.edit}>
        <span className={`icon icon-12px icon-action ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
}

export default Row
