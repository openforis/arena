import React from 'react'
import PropTypes from 'prop-types'

import { RecordCycle } from '@core/record/recordCycle'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKey, useSurveyCycleKeys } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

const CyclesSelector = (props) => {
  const { children, cyclesKeysSelectable, cyclesKeysSelected = [], disabled = false, onChange } = props

  const cyclesKeysSurvey = useSurveyCycleKeys()
  const cycleKeyCurrent = useSurveyCycleKey()
  const i18n = useI18n()

  if (cyclesKeysSurvey.length === 1) {
    return null
  }
  return (
    <FormItem label={i18n.t('common.cycle_plural')}>
      <div className="form-item_body">
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
        {children}
      </div>
    </FormItem>
  )
}

CyclesSelector.propTypes = {
  children: PropTypes.node,
  cyclesKeysSelectable: PropTypes.array, // Selectable cycle keys (default: all cycle keys)
  cyclesKeysSelected: PropTypes.array, // Selected cycle keys
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

export default CyclesSelector
