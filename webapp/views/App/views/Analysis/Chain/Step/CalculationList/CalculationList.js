import React, { useRef } from 'react'
import { useDispatch } from 'react-redux'

import * as Validation from '@core/validation/validation'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { useI18n } from '@webapp/store/system'
import { useChainEdit } from '@webapp/loggedin/modules/analysis/hooks'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { createCalculation } from '@webapp/loggedin/modules/analysis/step/actions'

import CalculationItem from './CalculationItem/CalculationItem'
import useDragDrop from './useDragDrop'

const CalculationList = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const { chain, step, editingCalculation } = useChainEdit()
  const calculations = Step.getCalculations(step)
  const stepValidation = Chain.getItemValidationByUuid(Step.getUuid(step))(chain)
  const calculationsValidation = Validation.getFieldValidation(Step.keys.calculations)(stepValidation)

  const placeholderRef = useRef(null)
  const { dragging, onDragStart, onDragEnd, onDragOver } = useDragDrop(placeholderRef)

  return (
    <div className="form-item">
      {!editingCalculation && (
        <div className="form-label chain-list__label">
          <ValidationTooltip validation={calculationsValidation}>
            {i18n.t('processingStepView.calculationSteps')}
          </ValidationTooltip>
          <button type="button" className="btn-s btn-transparent" onClick={() => dispatch(createCalculation())}>
            <span className="icon icon-plus icon-14px" />
          </button>
        </div>
      )}

      <div className="chain-list">
        {calculations.map((calculation) => (
          <CalculationItem
            key={Calculation.getUuid(calculation)}
            calculation={calculation}
            dragging={dragging}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
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

export default CalculationList
