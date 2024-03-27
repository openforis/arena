import React from 'react'
import PropTypes from 'prop-types'

import { RecordCycle } from '@core/record/recordCycle'

import ButtonGroup from '@webapp/components/form/buttonGroup'
import { FormItem } from '@webapp/components/form/Input'
import { useSurveyCycleKey, useSurveyCycleKeys } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

const CyclesSelector = (props) => {
  const { cyclesKeysSelectable, cyclesKeysSelected, disabled, onChange } = props

  const cyclesKeysSurvey = useSurveyCycleKeys()
  const cycleKeyCurrent = useSurveyCycleKey()
  const i18n = useI18n()

  if (cyclesKeysSurvey.length === 1) {
    return null
  }
  return (
    <FormItem label={i18n.t('common.cycle_plural')}>
      <ButtonGroup
        multiple
        deselectable
        selectedItemKey={cyclesKeysSelected}
        onChange={(cycles) => onChange(cycles.sort((a, b) => Number(a) - Number(b)))}
        items={cyclesKeysSurvey.map((cycle) => ({
          key: cycle,
          label: RecordCycle.getLabel(cycle),
          disabled:
            (cyclesKeysSelected.length === 1 && cycle === cyclesKeysSelected[0]) || // Disabled if current cycle is the only one selected in nodeDef
            cycle === cycleKeyCurrent || // Cannot remove nodeDef from current cycle
            (cyclesKeysSelectable && !cyclesKeysSelectable.includes(cycle)), // Cycle is not selectable
        }))}
        disabled={disabled}
      />
    </FormItem>
  )
}

CyclesSelector.propTypes = {
  cyclesKeysSelectable: PropTypes.array,
  cyclesKeysSelected: PropTypes.array,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
}

CyclesSelector.defaultProps = {
  cyclesKeysSelectable: null, // Selectable cycle keys (default: all cycle keys)
  cyclesKeysSelected: [], // Selected cycle keys
  disabled: false,
  onChange: (selection) => selection, // Required onChange function
}

export default CyclesSelector
