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
import { useConfirmDelete } from '@webapp/components/hooks'

const CyclesEditor = (props) => {
  const { cycles, readOnly, setCycles, validation } = props
  const cycleEntries = Object.entries(cycles)

  const confirmDelete = useConfirmDelete()
  const currentCycleKey = useSurveyCycleKey()

  const onDelete = (cycleKeyToDelete) => {
    const cycleLabel = Number(cycleKeyToDelete) + 1

    confirmDelete({
      key: 'homeView.surveyInfo.confirmDeleteCycle',
      params: { cycle: cycleKeyToDelete },
      headerText: 'homeView.surveyInfo.confirmDeleteCycleHeader',
      onOk: () => {
        delete cycles[cycleKeyToDelete]
        setCycles(cycles)
      },
      strongConfirm: true,
      strongConfirmRequiredText: `delete cycle ${cycleLabel}`,
    })
  }

  const canDeleteCycle = useCallback(
    ({ cycleKey, index }) => {
      const lastCycleIndex = Object.values(cycles).length - 1
      return !readOnly && cycleKey !== Survey.cycleOneKey && index === lastCycleIndex && cycleKey !== currentCycleKey
    },
    [readOnly, cycles, currentCycleKey]
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
