import React, { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useI18n } from '@webapp/store/system'

export const useMessageListColumns = () => {
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
    ],
    [i18n]
  )
}
