import { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'
import { User2FADevice } from '@core/user2FADevice'
import { ButtonIconEdit } from '@webapp/components'
import { AppIcon } from '@webapp/components/AppIcon'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useUser } from '@webapp/store/user'

export const useUser2FADeviceColumns = ({ onRowOpen }) => {
  const user = useUser()
  return useMemo(
    () => [
      {
        key: 'deviceName',
        header: 'user2FADevice:deviceName',
        renderItem: ({ item }) => <LabelWithTooltip label={User2FADevice.getDeviceName(item)} />,
      },
      {
        key: 'deviceNameFinal',
        header: 'user2FADevice:deviceNameFinal',
        renderItem: ({ item }) => <LabelWithTooltip label={User2FADevice.getDeviceNameFinal({ user })(item)} />,
      },
      {
        key: 'enabled',
        header: 'user2FADevice:enabled',
        renderItem: ({ item }) => User2FADevice.isEnabled(item) && <AppIcon name="check" />,
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
      {
        key: 'edit',
        width: '50px',
        renderItem: ({ item }) => <ButtonIconEdit onClick={() => onRowOpen(item)} />,
      },
    ],
    [onRowOpen, user]
  )
}
