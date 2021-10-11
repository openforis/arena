import React from 'react'

import { useI18n } from '@webapp/store/system'

export const ContentHeader = (props) => {
  const i18n = useI18n()

  const { column } = props
  const { key, header } = column

  return <div key={key}>{header ? i18n.t(header) : ''}</div>
}
