import React, { useRef } from 'react'
import * as R from 'ramda'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import ValidationTooltip from '@webapp/components/validationTooltip'

import CalculationItem from './CalculationItem'
import useDragDrop from './useDragDrop'

const CalculationList = (props) => {
  const { chain, step, calculation, onNewCalculation, onMoveCalculation, onDeleteCalculation } = props
  const editingCalculation = !R.isEmpty(calculation)

  const i18n = useI18n()
  const calculations = Step.getCalculations(step)
  const stepValidation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const calculationsValidation = Validation.getFieldValidation(Step.keys.calculations)(stepValidation)

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useDragDrop({
    placeholderRef,
    onDragEndFn: onMoveCalculation,
  })

  return (
    <div className="form-item">
      {!editingCalculation && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={calculationsValidation}>
            {i18n.t('processingStepView.calculationSteps')}
          </ValidationTooltip>
          <button type="button" className="btn-s btn-transparent" onClick={onNewCalculation}>
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
            onDeleteCalculation={onDeleteCalculation}
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
  chain: PropTypes.object.isRequired,
  step: PropTypes.object.isRequired,
  calculation: PropTypes.object.isRequired,
  onNewCalculation: PropTypes.func.isRequired,
  onMoveCalculation: PropTypes.func.isRequired,
  onDeleteCalculation: PropTypes.func.isRequired,
}

export default CalculationList
