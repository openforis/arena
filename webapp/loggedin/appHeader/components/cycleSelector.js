import React from 'react'
import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'

import { useI18n } from '../../../commonComponents/hooks'
import Dropdown from '../../../commonComponents/form/dropdown'

const CycleSelector = props => {
  const { surveyInfo, surveyCycleKey, onChange } = props
  const cycleKeys = R.pipe(Survey.getCycles, R.keys)(surveyInfo)

  if (cycleKeys.length === 1)
    return null

  const i18n = useI18n()

  const cycleItems = cycleKeys.map(key =>
    ({ key, value: `${i18n.t(`common.cycle`)} ${Number(key) + 1}` })
  )
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