import React from 'react'
import * as R from 'ramda'

import Survey from '../../../../common/survey/survey'
import User from '../../../../common/user/user'

import { useI18n } from '../../../commonComponents/hooks'
import Dropdown from '../../../commonComponents/form/dropdown'

const CycleSelector = props => {
  const { surveyInfo, user, onChange } = props
  const cycleKeys = R.pipe(Survey.getCycles, R.keys)(surveyInfo)

  if (cycleKeys.length === 1)
    return null

  const i18n = useI18n()

  const cycleItems = cycleKeys.map(key =>
    ({ key, value: `${i18n.t(`common.cycle`)} ${Number(key) + 1}` })
  )
  const userSurveyCycle = User.getPrefSurveyCycle(Survey.getIdSurveyInfo(surveyInfo))(user)
  const cycleSelection = R.find(R.propEq('key', userSurveyCycle), cycleItems)

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