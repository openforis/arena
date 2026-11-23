import type React from 'react'

import { RecordCycle } from '@core/record/recordCycle'

import { useSurveyCycleKey, useSurveyCycleKeys } from '@webapp/store/survey'

import { FormItem } from '@webapp/components/form/Input'
import ButtonGroup from '@webapp/components/form/buttonGroup'

type CyclesSelectorProps = {
  children?: React.ReactNode
  cyclesKeysSelectable?: any[] // Selectable cycle keys (default: all cycle keys)
  cyclesKeysSelected?: any[] // Selected cycle keys
  disabled?: boolean
  onChange: (...args: any[]) => any
}

const CyclesSelector = (props: CyclesSelectorProps) => {
  const { children, cyclesKeysSelectable, cyclesKeysSelected = [], disabled = false, onChange } = props

  const cyclesKeysSurvey = useSurveyCycleKeys()
  const cycleKeyCurrent = useSurveyCycleKey()

  if (cyclesKeysSurvey.length === 1) {
    return null
  }
  return (
    <FormItem label="common.cycle_other">
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

export default CyclesSelector
