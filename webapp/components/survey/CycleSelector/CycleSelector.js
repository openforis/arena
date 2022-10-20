import React from 'react'
import PropTypes from 'prop-types'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKeys } from '@webapp/store/survey'

import Dropdown from '@webapp/components/form/Dropdown'

const CycleSelector = (props) => {
  const { surveyCycleKey, onChange } = props

  const i18n = useI18n()
  const cycleKeys = useSurveyCycleKeys()

  if (cycleKeys.length === 1) {
    return null
  }

  const cycleItems = cycleKeys.map((cycleKey) => ({
    value: cycleKey,
    label: `${i18n.t('common.cycle')} ${Number(cycleKey) + 1}`,
  }))
  const cycleSelection = cycleItems.find((cycleItem) => cycleItem.value === surveyCycleKey)

  return (
    <Dropdown
      className="cycle-selector"
      items={cycleItems}
      onChange={(item) => onChange(item?.value)}
      searchable={false}
      selection={cycleSelection}
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
