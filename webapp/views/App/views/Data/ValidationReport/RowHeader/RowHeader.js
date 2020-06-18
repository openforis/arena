import React from 'react'

import { useI18n } from '@webapp/store/system'

const RowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div>#</div>
      <div>{i18n.t('common.path')}</div>
      <div>{i18n.t('common.message_plural')}</div>
      <div />
    </>
  )
}

export default RowHeader
