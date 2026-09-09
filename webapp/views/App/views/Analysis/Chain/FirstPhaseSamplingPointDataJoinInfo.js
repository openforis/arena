import React from 'react'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'

export const FirstPhaseSamplingPointDataJoinInfo = () => {
  const i18n = useI18n()

  return (
    <FormItem
      className="first-phase-sampling-point-data-join-info"
      label="chainView.firstPhaseSamplingPointDataJoinMethod.label"
    >
      <div className="first-phase-sampling-point-data-join-info__text">
        {i18n.t('chainView.firstPhaseSamplingPointDataJoinMethod.description')}
      </div>
    </FormItem>
  )
}
