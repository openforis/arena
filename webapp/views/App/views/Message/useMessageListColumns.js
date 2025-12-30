import React, { useMemo } from 'react'

import * as DateUtils from '@core/dateUtils'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

export const useMessageListColumns = () => {
  return useMemo(
    () => [
      {
        key: 'subject',
        header: 'message:subject',
        renderItem: ({ item }) => <LabelWithTooltip label={item.props.subject} />,
      },
      {
        key: 'status',
        header: 'message:status',
        renderItem: ({ item }) => item.status,
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
    []
  )
}
