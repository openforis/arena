import React from 'react'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/commonComponents/hooks'
import Dropdown from '@webapp/commonComponents/form/dropdown'

const CycleSelector = props => {
  const { surveyInfo, surveyCycleKey, onChange } = props
  const cycleKeys = Survey.getCycleKeys(surveyInfo)

  if (cycleKeys.length === 1) {
    return null
  }

  const i18n = useI18n()

  const cycleItems = cycleKeys.map(key => ({
    key,
    value: `${i18n.t('common.cycle')} ${Number(key) + 1}`,
  }))
  const cycleSelection = R.find(R.propEq('key', surveyCycleKey), cycleItems)

  return (
    <Dropdown
      items={cycleItems}
      selection={cycleSelection}
      onChange={item => onChange(R.prop('key', item))}
      readOnlyInput={true}
    />
  )
}

export default CycleSelector
