import React from 'react'
import PropTypes from 'prop-types'

import * as A from '@core/arena'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKeys } from '@webapp/store/survey'

import Dropdown from '@webapp/components/form/Dropdown'

const CycleSelector = (props) => {
  const {
    cycleKeys: cycleKeysProp,
    filterFunction = A.identity,
    onChange,
    readOnly = false,
    selectedCycle = null,
  } = props

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
      readOnly={readOnly}
      searchable={false}
      selection={cycleSelection}
    />
  )
}

CycleSelector.propTypes = {
  cycleKeys: PropTypes.array,
  filterFunction: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  selectedCycle: PropTypes.string,
}

export default CycleSelector
