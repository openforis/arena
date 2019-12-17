import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const ValidationReportRowHeader = () => {
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

export default ValidationReportRowHeader
