import React, { useRef } from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { State } from '../../store'

import CalculationItem from './CalculationItem'
import useDragDrop from './useDragDrop'

const CalculationList = (props) => {
  const { state, Actions } = props

  const chainEdit = State.getChainEdit(state)
  const stepEdit = State.getStepEdit(state)
  const calculationEdit = State.getCalculationEdit(state)
  const editingCalculation = Boolean(State.getCalculationEdit(state))

  const i18n = useI18n()
  const calculations = Step.getCalculations(stepEdit)
  const stepValidation = Chain.getItemValidationByUuid(Step.getUuid(stepEdit))(chainEdit)
  const calculationsValidation = Validation.getFieldValidation(Step.keys.calculations)(stepValidation)

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useDragDrop({
    placeholderRef,
    onDragEndFn: ({ indexFrom, indexTo }) => Actions.moveCalculation({ indexFrom, indexTo, state }),
  })

  return (
    <div className="form-item">
      {!editingCalculation && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={calculationsValidation}>
            {i18n.t('processingStepView.calculationSteps')}
          </ValidationTooltip>
          <button type="button" className="btn-s btn-transparent" onClick={() => Actions.createCalculation({ state })}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="chain-list">
        {calculations.map((processingCalculation) => (
          <CalculationItem
            key={Calculation.getUuid(processingCalculation)}
            chain={chainEdit}
            calculation={processingCalculation}
            calculationForEdit={calculationEdit}
            editingCalculation={editingCalculation}
            dragging={dragging}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            state={state}
            Actions={Actions}
          />
        ))}

        <div className="chain-list-item placeholder" ref={placeholderRef}>
          <div className="chain-list-item__index" />
          <div className="chain-list-item__content" />
        </div>
      </div>
    </div>
  )
}

CalculationList.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default CalculationList
