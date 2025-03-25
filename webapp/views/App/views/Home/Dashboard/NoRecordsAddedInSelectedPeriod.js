import React from 'react'

import { useI18n } from '@webapp/store/system'

export const NoRecordsAddedInSelectedPeriod = () => {
  const i18n = useI18n()

  return <div>{i18n.t('homeView.dashboard.noRecordsAddedInSelectedPeriod')}</div>
}
