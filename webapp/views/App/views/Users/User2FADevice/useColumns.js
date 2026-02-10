import React, { useMemo } from 'react'

import { User2FADevice } from '@core/user2FADevice'
import * as DateUtils from '@core/dateUtils'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

export const useUser2FADeviceColumns = () =>
  useMemo(
    () => [
      {
        key: 'deviceName',
        header: 'user2FADevice:deviceName',
        renderItem: ({ item }) => <LabelWithTooltip label={User2FADevice.getDeviceName(item)} />,
      },
      {
        key: 'enabled',
        header: 'user2FADevice:enabled',
        renderItem: ({ item }) => User2FADevice.isEnabled(item) && <span className="icon icon-checkmark" />,
        width: '7rem',
      },
      {
        key: 'date-created',
        header: 'common.dateCreated',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(User2FADevice.getDateCreated(item)),
      },
      {
        key: 'date-modified',
        header: 'common.dateLastModified',
        width: '12rem',
        renderItem: ({ item }) => DateUtils.convertDateTimeFromISOToDisplay(User2FADevice.getDateModified(item)),
      },
    ],
    []
  )
