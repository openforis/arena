import React from 'react'
import PropTypes from 'prop-types'

import * as SurveyCycle from '@core/survey/surveyCycle'

import { Button } from '@webapp/components'
import ValidationTooltip from '@webapp/components/validationTooltip'

import DateContainer from './DateContainer'

const CycleEditor = (props) => {
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

        {canDelete && (
          <Button
            className="btn-transparent btn-delete"
            iconClassName="icon-bin2 icon-12px"
            size="small"
            onClick={() => onDelete(cycleKey)}
          />
        )}
      </div>
    </ValidationTooltip>
  )
}

CycleEditor.propTypes = {
  cycleKey: PropTypes.string.isRequired,
  cycle: PropTypes.object.isRequired,
  readOnly: PropTypes.bool.isRequired,
  validation: PropTypes.object.isRequired,
  canDelete: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
}

export default CycleEditor
