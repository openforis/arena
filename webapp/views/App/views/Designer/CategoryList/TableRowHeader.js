import React from 'react'

import { useI18n } from '@webapp/store/system'

const TableRowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('#')}</div>
      <div>{i18n.t('common.name')}</div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </>
  )
}

export default TableRowHeader
