import React, { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'

export const useUserTwoFactorDeviceColumns = () => {
  const i18n = useI18n()

  return useMemo(
    () => [
      {
        key: 'deviceName',
        header: 'userTwoFactorDevice:deviceName',
        renderItem: ({ item }) => <LabelWithTooltip label={item.deviceName} />,
      },
      {
        key: 'enabled',
        header: 'userTwoFactorDevice:enabled',
        renderItem: ({ item }) => i18n.t(`userTwoFactorDevice:enabled.${item.enabled}`),
        width: '7rem',
      },
      {
        key: 'date-created',
        header: 'common.dateCreated',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(item.dateCreated),
      },
      {
        key: 'date-modified',
        header: 'common.dateLastModified',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(item.dateModified),
      },
    ],
    [i18n]
  )
}
