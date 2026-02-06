import React, { useMemo } from 'react'

import { UserTwoFactorDevice } from '@core/userTwoFactorDevice'
import * as DateUtils from '@core/dateUtils'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

export const useUserTwoFactorDeviceColumns = () => {
  return useMemo(
    () => [
      {
        key: 'deviceName',
        header: 'userTwoFactorDevice:deviceName',
        renderItem: ({ item }) => <LabelWithTooltip label={UserTwoFactorDevice.getDeviceName(item)} />,
      },
      {
        key: 'enabled',
        header: 'userTwoFactorDevice:enabled',
        renderItem: ({ item }) => UserTwoFactorDevice.isEnabled(item) && <span className="icon icon-checkmark" />,
        width: '7rem',
      },
      {
        key: 'date-created',
        header: 'common.dateCreated',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(UserTwoFactorDevice.getDateCreated(item)),
      },
      {
        key: 'date-modified',
        header: 'common.dateLastModified',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(UserTwoFactorDevice.getDateModified(item)),
      },
    ],
    []
  )
}
