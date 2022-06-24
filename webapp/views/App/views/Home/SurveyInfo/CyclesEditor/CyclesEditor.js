import './CyclesEditor.scss'

import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyCycle from '@core/survey/surveyCycle'
import * as Validation from '@core/validation/validation'

import CycleEditor from './CycleEditor'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { ButtonAdd } from '@webapp/components'

const CyclesEditor = (props) => {
  const { cycles, readOnly, setCycles, validation } = props
  const cycleEntries = Object.entries(cycles)

  const currentCycleKey = useSurveyCycleKey()

  const onDelete = (stepToDelete) => {
    delete cycles[stepToDelete]
    setCycles(cycles)
  }

  const canDeleteCycle = useCallback(
    ({ cycleKey, index }) =>
      !readOnly && cycleKey !== Survey.cycleOneKey && index === cycleEntries.length - 1 && cycleKey !== currentCycleKey,
    [readOnly, cycleEntries, currentCycleKey]
  )

  return (
    <div className="home-survey-info__cycles-editor">
      <div className="cycles">
        {cycleEntries.map(([cycleKey, cycle], index) => (
          <CycleEditor
            key={cycleKey}
            cycleKey={cycleKey}
            cycle={cycle}
            readOnly={readOnly}
            validation={Validation.getFieldValidation(cycleKey)(validation)}
            onChange={(cycleUpdate) => setCycles(R.assoc(cycleKey, cycleUpdate)(cycles))}
            canDelete={canDeleteCycle({ cycleKey, index })}
            onDelete={onDelete}
          />
        ))}

        {!readOnly && (
          <ButtonAdd
            showLabel={false}
            size="small"
            onClick={() => setCycles(R.assoc(cycleEntries.length, SurveyCycle.newCycle())(cycles))}
          />
        )}
      </div>
    </div>
  )
}

CyclesEditor.propTypes = {
  cycles: PropTypes.object.isRequired,
  readOnly: PropTypes.bool.isRequired,
  setCycles: PropTypes.func.isRequired,
  validation: PropTypes.object,
}
CyclesEditor.defaultProps = {
  validation: {},
}

export default CyclesEditor
