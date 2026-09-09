import React from 'react'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'

export const FirstPhaseSamplingPointDataJoinInfo = () => {
  const i18n = useI18n()

  return (
    <FormItem label="chainView.firstPhaseSamplingPointDataJoinMethod.label">
      <div className="first-phase-sampling-point-data-join-info">
        {i18n.t('chainView.firstPhaseSamplingPointDataJoinMethod.description')}
      </div>
    </FormItem>
  )
}
