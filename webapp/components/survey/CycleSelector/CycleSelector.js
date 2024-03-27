import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import Dropdown from '@webapp/components/form/Dropdown'
import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const CycleSelector = (props) => {
  const { cycleKeys: cycleKeysProp, selectedCycle, filterFunction, onChange } = props

  const i18n = useI18n()
  const cycleKeysInState = useSurveyCycleKeys()
  const cycleKeys = cycleKeysProp ?? cycleKeysInState

  if (cycleKeys.length === 1) {
    return null
  }

  const cycleItems = cycleKeys.filter(filterFunction).map((cycleKey) => ({
    value: cycleKey,
    label: `${i18n.t('common.cycle')} ${Number(cycleKey) + 1}`,
  }))
  const cycleSelection = cycleItems.find((cycleItem) => cycleItem.value === selectedCycle)

  return (
    <Dropdown
      className="cycle-selector"
      clearable={false}
      items={cycleItems}
      onChange={(item) => onChange(item?.value)}
      searchable={false}
      selection={cycleSelection}
    />
  )
}

CycleSelector.propTypes = {
  cycleKeys: PropTypes.array,
  filterFunction: PropTypes.func,
  selectedCycle: PropTypes.string,
  onChange: PropTypes.func,
}

CycleSelector.defaultProps = {
  selectedCycle: null,
  onChange: () => ({}),
  filterFunction: A.identity,
}

export default CycleSelector
