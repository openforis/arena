import React, { useCallback, useState } from 'react'

import * as User from '@core/user/user'
import * as DateUtils from '@core/dateUtils'

import { Table } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'
import { useInterval } from '@webapp/components/hooks'

const updateInterval = 60000 // 60 sec

export const ActiveUsers = () => {
  const i18n = useI18n()

  const [requestTime, setRequestTime] = useState(Date.now())
  const updateRequestTime = useCallback(() => setRequestTime(Date.now()), [])
  useInterval(updateRequestTime, updateInterval)

  return (
    <Table
      columns={[
        {
          key: 'name',
          header: 'common.name',
          renderItem: ({ item }) => <LabelWithTooltip label={User.getName(item)} />,
          width: 'minmax(15rem, 1fr)',
        },
        {
          key: 'email',
          header: 'common.email',
          renderItem: ({ item }) => <LabelWithTooltip label={User.getEmail(item)} />,
          width: 'minmax(15rem, 1fr)',
        },
        {
          key: 'lastLogin',
          header: 'usersView.lastLogin',
          width: '14rem',
          renderItem: ({ item }) => {
            const lastLoginTime = User.getLastLoginTime(item)
            if (lastLoginTime) {
              return DateUtils.convertDateTimeFromISOToDisplay(lastLoginTime)
            } else if (User.hasAccepted(item)) {
              return i18n.t('usersView.moreThan30DaysAgo')
            }
          },
        },
      ]}
      module="users-active"
      moduleApiUri="/api/users-active"
      restParams={{ requestTime }}
      showFooter={false}
      showHeader={false}
    />
  )
}
