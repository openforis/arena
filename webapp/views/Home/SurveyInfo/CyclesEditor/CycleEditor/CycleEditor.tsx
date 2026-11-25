import type { ArenaValidation } from '@openforis/arena-core'

import * as SurveyCycle from '@core/survey/surveyCycle'
import { ButtonIconDelete } from '@webapp/components'
import ValidationTooltip from '@webapp/components/ValidationTooltip'

import DateContainer from './DateContainer'

type CycleEditorProps = {
  cycleKey: string
  cycle: Record<string, any>
  readOnly: boolean
  validation: ArenaValidation
  canDelete: boolean
  onChange: (...args: any[]) => any
  onDelete: (...args: any[]) => any
}

const CycleEditor = (props: CycleEditorProps) => {
  const { cycleKey, cycle, readOnly, validation, canDelete, onChange, onDelete } = props

  const stepNum = Number(cycleKey) + 1

  return (
    <ValidationTooltip validation={validation} showKeys={false}>
      <div key={cycleKey} className="cycle">
        <div className="step">{stepNum}</div>
        <DateContainer
          date={SurveyCycle.getDateStart(cycle)}
          keyLabel="common.from"
          readOnly={readOnly}
          onChange={(date) => onChange(SurveyCycle.setDateStart(date)(cycle))}
        />
        {(SurveyCycle.getDateEnd(cycle) || !readOnly) && (
          <DateContainer
            date={SurveyCycle.getDateEnd(cycle)}
            keyLabel="common.to"
            readOnly={readOnly}
            onChange={(date) => onChange(SurveyCycle.setDateEnd(date)(cycle))}
          />
        )}

        {canDelete && <ButtonIconDelete onClick={() => onDelete(cycleKey)} />}
      </div>
    </ValidationTooltip>
  )
}

export default CycleEditor
