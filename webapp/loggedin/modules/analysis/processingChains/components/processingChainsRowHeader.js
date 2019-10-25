import React from 'react'

import { useI18n } from '@webapp/commonComponents/hooks'

const ProcessingChainsRowHeader = () => {
  const i18n = useI18n()

  return (
    <>
      <div>{i18n.t('common.label')}</div>
      <div>{i18n.t('common.dateLastModified')}</div>
      <div>{i18n.t('processingChainView.dateExecuted')}</div>
      <div>{i18n.t('common.draft')}</div>
      <div>{i18n.t('processingChainView.status')}</div>
    </>
  )
}

export default ProcessingChainsRowHeader