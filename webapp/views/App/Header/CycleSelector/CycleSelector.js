import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'

const CycleSelector = (props) => {
  const { surveyInfo, surveyCycleKey, onChange } = props
  const cycleKeys = Survey.getCycleKeys(surveyInfo)

  if (cycleKeys.length === 1) {
    return null
  }

  const i18n = useI18n()

  const cycleItems = cycleKeys.map((key) => ({
    key,
    value: `${i18n.t('common.cycle')} ${Number(key) + 1}`,
  }))
  const cycleSelection = R.find(R.propEq('key', surveyCycleKey), cycleItems)

  return (
    <Dropdown
      items={cycleItems}
      selection={cycleSelection}
      onChange={(item) => onChange(R.prop('key', item))}
      readOnlyInput
    />
  )
}

CycleSelector.propTypes = {
  surveyInfo: PropTypes.object,
  surveyCycleKey: PropTypes.string,
  onChange: PropTypes.func,
}

CycleSelector.defaultProps = {
  surveyInfo: null,
  surveyCycleKey: null,
  onChange: () => ({}),
}

export default CycleSelector
