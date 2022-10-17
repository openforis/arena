import React from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKeys } from '@webapp/store/survey'

import Dropdown from '@webapp/components/form/Dropdown'

const CycleSelector = (props) => {
  const { surveyCycleKey, onChange } = props

  const cycleKeys = useSurveyCycleKeys()

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
      className="cycle-selector"
      items={cycleItems}
      selection={cycleSelection}
      onChange={(item) => onChange(R.prop('key', item))}
      readOnlyInput
    />
  )
}

CycleSelector.propTypes = {
  surveyCycleKey: PropTypes.string,
  onChange: PropTypes.func,
}

CycleSelector.defaultProps = {
  surveyCycleKey: null,
  onChange: () => ({}),
}

export default CycleSelector
