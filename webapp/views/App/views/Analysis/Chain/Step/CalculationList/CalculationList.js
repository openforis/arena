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
  const { chain, step, calculation, editingCalculation } = State.get(state)

  const i18n = useI18n()
  const calculations = Step.getCalculations(step)
  const stepValidation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const calculationsValidation = Validation.getFieldValidation(Step.keys.calculations)(stepValidation)

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useDragDrop({
    placeholderRef,
    onDragEndFn: Actions.calculation.move,
  })

  return (
    <div className="form-item">
      {!editingCalculation && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={calculationsValidation}>
            {i18n.t('processingStepView.calculationSteps')}
          </ValidationTooltip>
          <button type="button" className="btn-s btn-transparent" onClick={Actions.calculation.create}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="chain-list">
        {calculations.map((processingCalculation) => (
          <CalculationItem
            key={Calculation.getUuid(processingCalculation)}
            chain={chain}
            calculation={processingCalculation}
            calculationForEdit={calculation}
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
