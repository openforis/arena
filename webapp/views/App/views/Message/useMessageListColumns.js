import { useMemo } from 'react'

import { MessageStatus, Messages } from '@openforis/arena-core'

import * as DateUtils from '@core/dateUtils'

import { ButtonIconEditOrView } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'

export const useMessageListColumns = ({ onRowOpen }) => {
  const i18n = useI18n()

  return useMemo(
    () => [
      {
        key: 'subject',
        header: 'messageView:subject',
        renderItem: ({ item }) => <LabelWithTooltip label={item.props.subject} />,
      },
      {
        key: 'status',
        header: 'messageView:status.label',
        renderItem: ({ item }) => i18n.t(`messageView:status.${item.status}`),
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
      {
        key: 'edit',
        width: '50px',
        renderItem: ({ item }) => (
          // sent messages can only be viewed
          <ButtonIconEditOrView
            canEdit={Messages.getStatus(item) !== MessageStatus.Sent}
            onClick={() => onRowOpen(item)}
          />
        ),
      },
    ],
    [i18n, onRowOpen]
  )
}
