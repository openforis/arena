import './UsersList.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as User from '@core/user/user'
import * as DateUtils from '@core/dateUtils'

import { appModuleUri, userModules } from '@webapp/app/appModules'
import Table from '@webapp/components/Table'
import ProfilePicture from '@webapp/components/profilePicture'
import { ButtonIconEdit } from '@webapp/components'

import { useI18n } from '@webapp/store/system'

import { UserSurveysTable } from './UserSurveysTable'
import { TableHeaderLeft } from './TableHeaderLeft'

export const UsersList = () => {
  const history = useHistory()
  const i18n = useI18n()

  const goToUserDetails = (user) =>
    history.push(`${appModuleUri(userModules.user)}${User.getUuid(user)}?hideSurveyGroup=true`)

  return (
    <Table
      module="users"
      moduleApiUri="/api/users"
      className="users-list"
      columns={[
        {
          key: 'profile-picture',
          width: '40px',
          renderItem: ({ item }) => <ProfilePicture userUuid={User.getUuid(item)} thumbnail />,
        },
        { key: 'email', header: 'common.email', renderItem: ({ item }) => User.getEmail(item) },
        { key: 'name', header: 'common.name', renderItem: ({ item }) => User.getName(item) },
        {
          key: 'accepted',
          header: 'usersView.accepted',
          width: '10rem',
          renderItem: ({ item }) => User.hasAccepted(item) && <span className="icon icon-checkmark" />,
        },
        {
          key: 'is-system-admin',
          header: 'authGroups.systemAdmin.label',
          width: '15rem',
          renderItem: ({ item }) => User.isSystemAdmin(item) && <span className="icon icon-checkmark" />,
        },
        {
          key: 'is-survey-manager',
          header: 'authGroups.surveyManager.label',
          width: '15rem',
          renderItem: ({ item }) => User.isSurveyManager(item) && <span className="icon icon-checkmark" />,
        },
        {
          key: 'lastLogin',
          header: 'usersView.lastLogin',
          width: '14rem',
          renderItem: ({ item }) => {
            const lastLoginTime = User.getLastLoginTime(item)
            if (lastLoginTime) {
              return DateUtils.convertDate({
                dateStr: lastLoginTime,
                formatFrom: DateUtils.formats.datetimeISO,
                formatTo: DateUtils.formats.datetimeDisplay,
                adjustTimezoneDifference: true,
              })
            } else if (User.hasAccepted(item)) {
              return i18n.t('usersView.moreThan30DaysAgo')
            }
          },
        },
        {
          key: 'user-edit',
          width: '40px',
          renderItem: ({ item }) => (
            <ButtonIconEdit disabled={!User.hasAccepted(item)} onClick={() => goToUserDetails(item)} />
          ),
        },
      ]}
      expandableRows
      isRowExpandable={({ item }) => !User.isSystemAdmin(item)}
      rowExpandedComponent={({ item }) => <UserSurveysTable user={item} />}
      headerLeftComponent={TableHeaderLeft}
    />
  )
}
