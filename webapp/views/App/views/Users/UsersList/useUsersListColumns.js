import React, { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router'

import * as User from '@core/user/user'
import * as DateUtils from '@core/dateUtils'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import ProfilePicture from '@webapp/components/profilePicture'
import { ButtonIconEdit } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'

export const useUsersListColumns = () => {
  const navigate = useNavigate()
  const i18n = useI18n()

  const goToUserDetails = useCallback(
    (user) => navigate(`${appModuleUri(userModules.user)}${User.getUuid(user)}?hideSurveyGroup=true`),
    [navigate]
  )

  return useMemo(
    () => [
      {
        key: 'profile-picture',
        width: '40px',
        renderItem: ({ item }) => <ProfilePicture userUuid={User.getUuid(item)} thumbnail />,
      },
      {
        key: 'email',
        header: 'common.email',
        renderItem: ({ item }) => <LabelWithTooltip label={User.getEmail(item)} />,
        sortable: true,
      },
      {
        key: 'name',
        header: 'common.name',
        renderItem: ({ item }) => <LabelWithTooltip label={User.getName(item)} />,
        sortable: true,
      },
      {
        key: 'status',
        header: 'usersView.accepted',
        width: '7rem',
        renderItem: ({ item }) => User.hasAccepted(item) && <span className="icon icon-checkmark" />,
        sortable: true,
      },
      {
        key: 'is-system-admin',
        header: 'authGroups.systemAdmin.label',
        width: '12rem',
        renderItem: ({ item }) => User.isSystemAdmin(item) && <span className="icon icon-checkmark" />,
      },
      {
        key: 'is-survey-manager',
        header: 'authGroups.surveyManager.label',
        width: '11rem',
        renderItem: ({ item }) => User.isSurveyManager(item) && <span className="icon icon-checkmark" />,
      },
      {
        key: 'last_login_time',
        header: 'usersView.lastLogin',
        width: '12rem',
        renderItem: ({ item }) => {
          const lastLoginTime = User.getLastLoginTime(item)
          if (lastLoginTime) {
            return DateUtils.convertDateTimeFromISOToDisplay(lastLoginTime)
          } else if (User.hasAccepted(item)) {
            return i18n.t('usersView.moreThan30DaysAgo')
          }
        },
        sortable: true,
      },
      {
        key: 'user-edit',
        width: '40px',
        renderItem: ({ item }) => (
          <ButtonIconEdit disabled={!User.hasAccepted(item)} onClick={() => goToUserDetails(item)} />
        ),
      },
      {
        key: User.keys.surveysCountDraft,
        header: 'usersView.surveysDraft',
        hidden: true,
        renderItem: ({ item }) => User.getSurveysCountDraft(item),
        width: '10rem',
      },
      {
        key: User.keys.surveysCountPublished,
        header: 'usersView.surveysPublished',
        hidden: true,
        renderItem: ({ item }) => User.getSurveysCountPublished(item),
        width: '12rem',
      },
    ],
    [goToUserDetails, i18n]
  )
}
